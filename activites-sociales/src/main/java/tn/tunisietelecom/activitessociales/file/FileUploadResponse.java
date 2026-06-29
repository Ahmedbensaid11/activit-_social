package tn.tunisietelecom.activitessociales.file;

public record FileUploadResponse(String fileName, String url, long size, String contentType) {
}
