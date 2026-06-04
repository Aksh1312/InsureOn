from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import uuid

router = APIRouter(prefix="/mock-payments", tags=["Mock Payments"])

class UPIPaymentRequest(BaseModel):
    upi_id: str
    amount: float
    currency: str = "INR"
    reference: str

class BankTransferRequest(BaseModel):
    user_id: int
    amount: float
    currency: str = "INR"
    reference: str

class PaymentResponse(BaseModel):
    transaction_id: str
    status: str = "success"

@router.post("/upi", response_model=PaymentResponse)
async def process_upi_payment(request: UPIPaymentRequest):
    """
    Mock UPI payment endpoint for development/testing
    """
    # Simulate network delay
    import time
    time.sleep(0.5)
    
    # Generate mock transaction ID
    transaction_id = f"UPI_{uuid.uuid4().hex[:12].upper()}"
    
    return PaymentResponse(transaction_id=transaction_id)

@router.post("/bank-transfer", response_model=PaymentResponse)
async def process_bank_transfer(request: BankTransferRequest):
    """
    Mock bank transfer endpoint for development/testing
    """
    # Simulate network delay
    import time
    time.sleep(0.8)
    
    # Generate mock transaction ID
    transaction_id = f"BANK_{uuid.uuid4().hex[:12].upper()}"
    
    return PaymentResponse(transaction_id=transaction_id)

# Health check for mock payment service
@router.get("/health")
async def health_check():
    return {"status": "ok", "service": "mock-payment-gateway"}