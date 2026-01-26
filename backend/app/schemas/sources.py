from pydantic import BaseModel, HttpUrl
from typing import Optional, Dict


class SubstackSubscription(BaseModel):
    id: str
    user_id: str
    publication_id: str
    publication_name: str
    priority: Optional[int] = None
    enabled: bool = True


class SubstackPriorities(BaseModel):
    priorities: Dict[str, int]  # publication_id -> priority (1-5)


class RSSSource(BaseModel):
    id: str
    user_id: str
    url: str
    name: str
    enabled: bool = True


class RSSSourceCreate(BaseModel):
    url: str
    name: str


class NewsTopic(BaseModel):
    id: str
    user_id: str
    topic: str
    enabled: bool = True


class NewsTopicCreate(BaseModel):
    topic: str
