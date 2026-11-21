from typing import Literal
from uuid import UUID

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field, StrictBool


CardType = Literal[
    "name-to-symbol",
    "symbol-to-name",
    "name-to-atomic-number",
    "name-to-group",
    "name-to-category",
]


class LearningSessionAnswerData(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True, from_attributes=True)

    element_id: int = Field(alias="elementId", strict=True, ge=1, le=20)
    card_type: CardType = Field(alias="cardType")
    selected_answer: str = Field(alias="selectedAnswer", min_length=1, pattern=r"\S")
    correct_answer: str = Field(alias="correctAnswer", min_length=1, pattern=r"\S")
    is_correct: StrictBool = Field(alias="isCorrect")


class CompletedLearningSessionData(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True, from_attributes=True)

    id: UUID
    level_id: int = Field(alias="levelId", strict=True, ge=1, le=6)
    completed_at: AwareDatetime = Field(alias="completedAt")
    answers: list[LearningSessionAnswerData] = Field(min_length=10, max_length=10)
