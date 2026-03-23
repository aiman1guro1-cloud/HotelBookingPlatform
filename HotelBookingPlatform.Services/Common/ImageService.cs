using Microsoft.AspNetCore.Http;

namespace HotelBookingPlatform.Services.Common;

public interface IImageService
{
    Task<string> UploadImageAsync(IFormFile file, string folderName);
    void DeleteImage(string imageUrl);
}

public class ImageService : IImageService
{
    private readonly string _webRootPath;

    public ImageService(string webRootPath)
    {
        _webRootPath = webRootPath;
    }

    public async Task<string> UploadImageAsync(IFormFile file, string folderName)
    {
        if (file == null || file.Length == 0)
            throw new ArgumentException("File is empty");

        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
        var extension = Path.GetExtension(file.FileName).ToLower();

        if (!allowedExtensions.Contains(extension))
            throw new ArgumentException("Invalid file type. Only JPG, PNG, and WebP are allowed.");

        if (file.Length > 5 * 1024 * 1024)
            throw new ArgumentException("File size exceeds 5MB limit.");

        var fileName = $"{Guid.NewGuid()}{extension}";
        var folderPath = Path.Combine(_webRootPath, "uploads", folderName);
        
        if (!Directory.Exists(folderPath))
            Directory.CreateDirectory(folderPath);

        var filePath = Path.Combine(folderPath, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        return $"/uploads/{folderName}/{fileName}";
    }

    public void DeleteImage(string imageUrl)
    {
        if (string.IsNullOrEmpty(imageUrl) || imageUrl.StartsWith("http")) return;

        var relativePath = imageUrl.TrimStart('/');
        var filePath = Path.Combine(_webRootPath, relativePath);

        if (File.Exists(filePath))
        {
            File.Delete(filePath);
        }
    }
}
