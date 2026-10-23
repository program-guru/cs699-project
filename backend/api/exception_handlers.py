from fastapi import HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from models.dto import DTO


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content=DTO(
            success=False,
            message=str(exc.detail),
            data=None,
        ).model_dump(),
        headers=exc.headers,
    )


async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    error_messages = []
    for error in exc.errors():
        field = " -> ".join(str(location) for location in error["loc"])
        error_messages.append(f"{field}: {error['msg']}")

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=DTO(
            success=False,
            message=f"Validation error: {'; '.join(error_messages)}",
            data=None,
        ).model_dump(),
    )


async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=DTO(
            success=False,
            message=f"Internal server error: {exc}",
            data=None,
        ).model_dump(),
    )
