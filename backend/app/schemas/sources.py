from pydantic import BaseModel, HttpUrl
from typing import Optional, Dict


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
