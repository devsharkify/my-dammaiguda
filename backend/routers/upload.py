"""File Upload Router - Cloudinary Integration"""
import os
import cloudinary
import cloudinary.uploader
from fastapi import APIRouter, HTTPException, File, UploadFile, Form
from pydantic import BaseModel
from typing import Optional
import base64

router = APIRouter(prefix="/upload", tags=["Upload"])

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME"),
    api_key=os.environ.get("CLOUDINARY_API_KEY"),
    api_secret=os.environ.get("CLOUDINARY_API_SECRET")
)


class Base64UploadRequest(BaseModel):
    image_data: str  # Base64 encoded image
    folder: Optional[str] = "dammaiguda"


@router.post("/image")
async def upload_image(file: UploadFile = File(...), folder: str = Form(default="dammaiguda")):
    """
    Upload an image file to Cloudinary.
    Returns the public URL of the uploaded image.
    """
    try:
        # Read file content
        content = await file.read()
        
        # Upload to Cloudinary
        result = cloudinary.uploader.upload(
            content,
            folder=folder,
            resource_type="auto",
            allowed_formats=["jpg", "jpeg", "png", "gif", "webp"],
            transformation=[
                {"width": 1200, "crop": "limit"},
                {"quality": "auto:good"},
                {"fetch_format": "auto"}
            ]
        )
        
        return {
            "success": True,
            "url": result["secure_url"],
            "public_id": result["public_id"],
            "width": result.get("width"),
            "height": result.get("height"),
            "format": result.get("format")
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.post("/image-base64")
async def upload_image_base64(request: Base64UploadRequest):
    """
    Upload a base64 encoded image to Cloudinary.
    Useful for frontend direct uploads.
    """
    try:
        image_data = request.image_data
        
        # Remove data URL prefix if present
        if "," in image_data:
            image_data = image_data.split(",")[1]
        
        # Upload to Cloudinary
        result = cloudinary.uploader.upload(
            f"data:image/auto;base64,{image_data}",
            folder=request.folder,
            resource_type="auto",
            transformation=[
                {"width": 1200, "crop": "limit"},
                {"quality": "auto:good"},
                {"fetch_format": "auto"}
            ]
        )
        
        return {
            "success": True,
            "url": result["secure_url"],
            "public_id": result["public_id"],
            "width": result.get("width"),
            "height": result.get("height"),
            "format": result.get("format")
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.delete("/image/{public_id:path}")
async def delete_image(public_id: str):
    """
    Delete an image from Cloudinary by its public_id.
    """
    try:
        result = cloudinary.uploader.destroy(public_id)
        
        if result.get("result") == "ok":
            return {"success": True, "message": "Image deleted"}
        else:
            return {"success": False, "message": "Image not found or already deleted"}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")
