from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.schemas import ConciergeChatRequest, ConciergeChatResponse
from app.services.concierge_service import answer_concierge_query

router = APIRouter(prefix="/concierge", tags=["AI Concierge"])

@router.post("/chat", response_model=ConciergeChatResponse)
def chat_with_concierge(request: ConciergeChatRequest, db: Session = Depends(get_db)):
    result = answer_concierge_query(request.message, db)
    return ConciergeChatResponse(**result)
