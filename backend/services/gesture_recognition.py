from __future__ import annotations

from base64 import b64decode
from io import BytesIO
from pathlib import Path
from typing import Any

import numpy as np
import torch
from PIL import Image, ImageFilter, ImageOps
from torch import nn
from torch.nn import functional as F


MODEL_DIR = Path(__file__).resolve().parents[2] / "model"
CHECKPOINT_PATH = MODEL_DIR / "best_model.pth"
REFERENCE_EMBEDDINGS_PATH = MODEL_DIR / "reference_embeddings.npz"


class ConvBlock(nn.Module):
    def __init__(self, in_channels: int, out_channels: int, kernel_size: int, dropout: float = 0.15):
        super().__init__()
        padding = kernel_size // 2
        self.conv = nn.Conv1d(in_channels, out_channels, kernel_size=kernel_size, padding=padding)
        self.bn = nn.BatchNorm1d(out_channels)
        self.dropout = nn.Dropout(dropout)

    def forward(self, inputs: torch.Tensor) -> torch.Tensor:
        outputs = self.conv(inputs)
        outputs = self.bn(outputs)
        outputs = F.relu(outputs)
        return self.dropout(outputs)


class GestureBackbone(nn.Module):
    def __init__(self, input_dim: int = 258, embedding_dim: int = 256):
        super().__init__()
        self.conv_blocks = nn.ModuleList([
            ConvBlock(input_dim, 64, 5),
            ConvBlock(64, 128, 5),
            ConvBlock(128, 256, 3),
        ])
        self.fc = nn.Linear(256, embedding_dim)

    def forward(self, inputs: torch.Tensor) -> torch.Tensor:
        outputs = inputs
        for block in self.conv_blocks:
            outputs = block(outputs)
        outputs = outputs.mean(dim=-1)
        return self.fc(outputs)


class GestureRecognitionService:
    def __init__(self) -> None:
        self.device = torch.device("cpu")
        self.model = GestureBackbone()
        checkpoint = torch.load(CHECKPOINT_PATH, map_location=self.device)
        self.model.load_state_dict(checkpoint["backbone_state_dict"], strict=True)
        self.model.eval()

        reference = np.load(REFERENCE_EMBEDDINGS_PATH, allow_pickle=True)
        words = list(reference.files)
        embeddings = [np.asarray(reference[word], dtype=np.float32) for word in words]
        stacked = np.stack(embeddings, axis=0)
        norms = np.linalg.norm(stacked, axis=1, keepdims=True)
        self.reference_matrix = stacked / np.clip(norms, 1e-8, None)
        self.reference_words = words
        self.reference_by_word = {
            word: self.reference_matrix[index]
            for index, word in enumerate(self.reference_words)
        }

    @staticmethod
    def _decode_image(image_data: str) -> np.ndarray:
        payload = image_data.split(",", 1)[1] if "," in image_data else image_data
        raw = b64decode(payload)
        image = Image.open(BytesIO(raw)).convert("RGB")
        return np.asarray(image, dtype=np.uint8)

    def _extract_features(self, image_data: str) -> np.ndarray:
        rgb_image = self._decode_image(image_data)
        image = Image.fromarray(rgb_image)

        grayscale = ImageOps.grayscale(ImageOps.contain(image, (258, 258), method=Image.Resampling.BILINEAR))
        grayscale = ImageOps.fit(grayscale, (258, 1), method=Image.Resampling.BILINEAR)
        grayscale_features = np.asarray(grayscale, dtype=np.float32).reshape(-1) / 255.0

        edges = image.filter(ImageFilter.FIND_EDGES)
        edges = ImageOps.grayscale(ImageOps.fit(edges, (258, 1), method=Image.Resampling.BILINEAR))
        edge_features = np.asarray(edges, dtype=np.float32).reshape(-1) / 255.0

        feature_vector = ((grayscale_features + edge_features) * 0.5).astype(np.float32)
        if feature_vector.size < 258:
            feature_vector = np.pad(feature_vector, (0, 258 - feature_vector.size))
        return feature_vector[:258]

    def encode(self, frame_data: list[str]) -> np.ndarray:
        frames = list(frame_data)
        if not frames:
            raise ValueError("At least one frame is required")

        if len(frames) < 5:
            frames = frames + [frames[-1]] * (5 - len(frames))

        feature_stack = np.stack([self._extract_features(frame) for frame in frames[:5]], axis=-1)
        tensor = torch.from_numpy(feature_stack).float().unsqueeze(0)

        with torch.no_grad():
            embedding = self.model(tensor).squeeze(0).cpu().numpy().astype(np.float32)

        norm = np.linalg.norm(embedding)
        if norm > 0:
            embedding = embedding / norm

        return embedding

    def verify(self, target_word: str, frame_data: list[str], top_k: int = 5, threshold: float = 0.72) -> dict[str, Any]:
        normalized_target = target_word.strip().upper()
        if normalized_target not in self.reference_by_word:
            raise KeyError(normalized_target)

        embedding = self.encode(frame_data)
        similarities = self.reference_matrix @ embedding
        ranked_indices = np.argsort(similarities)[::-1]

        top_matches = []
        for index in ranked_indices[: max(1, top_k)]:
            top_matches.append(
                {
                    "word": self.reference_words[index],
                    "similarity": float(similarities[index]),
                }
            )

        best_index = int(ranked_indices[0])
        best_match = self.reference_words[best_index]
        target_similarity = float(self.reference_by_word[normalized_target] @ embedding)
        best_similarity = float(similarities[best_index])
        is_match = best_match == normalized_target and target_similarity >= threshold

        return {
            "target_word": normalized_target,
            "best_match": best_match,
            "similarity": best_similarity,
            "target_similarity": target_similarity,
            "threshold": threshold,
            "is_match": is_match,
            "top_matches": top_matches,
            "message": "Match confirmed" if is_match else "Keep trying",
        }


_SERVICE: GestureRecognitionService | None = None


def get_gesture_service() -> GestureRecognitionService:
    global _SERVICE
    if _SERVICE is None:
        _SERVICE = GestureRecognitionService()
    return _SERVICE