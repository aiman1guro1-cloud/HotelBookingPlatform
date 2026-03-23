using Xunit;
using Moq;
using HotelBookingPlatform.Services.Auth;
using HotelBookingPlatform.Core.Interfaces;
using HotelBookingPlatform.Core.Entities;
using HotelBookingPlatform.Core.DTOs;
using HotelBookingPlatform.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;
using System;

namespace HotelBookingPlatform.Tests
{
    public class AuthServiceTests
    {
        private readonly Mock<IPasswordService> _passwordServiceMock;
        private readonly Mock<IJwtService> _jwtServiceMock;
        private readonly Mock<ILogger<AuthService>> _loggerMock;
        private readonly DbContextOptions<ApplicationDbContext> _dbContextOptions;

        public AuthServiceTests()
        {
            _passwordServiceMock = new Mock<IPasswordService>();
            _jwtServiceMock = new Mock<IJwtService>();
            _loggerMock = new Mock<ILogger<AuthService>>();
            _dbContextOptions = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
        }

        [Fact]
        public async Task LoginAsync_ValidCredentials_ReturnsAuthResponse()
        {
            // Arrange
            var email = "test@example.com";
            var password = "password123";
            var passwordHash = "hashed_password";
            var user = new User { Email = email, PasswordHash = passwordHash };

            using (var context = new ApplicationDbContext(_dbContextOptions))
            {
                context.Users.Add(user);
                await context.SaveChangesAsync();
            }

            _passwordServiceMock.Setup(p => p.VerifyPassword(password, passwordHash)).Returns(true);
            _jwtServiceMock.Setup(j => j.GenerateToken(It.IsAny<User>())).Returns("test_token");

            using (var context = new ApplicationDbContext(_dbContextOptions))
            {
                var authService = new AuthService(context, _passwordServiceMock.Object, _jwtServiceMock.Object, _loggerMock.Object);
                var loginDto = new LoginDto { Email = email, Password = password };

                // Act
                var result = await authService.LoginAsync(loginDto);

                // Assert
                Assert.NotNull(result);
                Assert.Equal(email, result.Email);
                Assert.Equal("test_token", result.Token);
            }
        }

        [Fact]
        public async Task LoginAsync_InvalidEmail_ThrowsUnauthorizedAccessException()
        {
            // Arrange
            var email = "nonexistent@example.com";
            var password = "password123";

            using (var context = new ApplicationDbContext(_dbContextOptions))
            {
                var authService = new AuthService(context, _passwordServiceMock.Object, _jwtServiceMock.Object, _loggerMock.Object);
                var loginDto = new LoginDto { Email = email, Password = password };

                // Act & Assert
                await Assert.ThrowsAsync<UnauthorizedAccessException>(() => authService.LoginAsync(loginDto));
            }
        }

        [Fact]
        public async Task LoginAsync_InvalidPassword_ThrowsUnauthorizedAccessException()
        {
            // Arrange
            var email = "test@example.com";
            var password = "wrong_password";
            var passwordHash = "hashed_password";
            var user = new User { Email = email, PasswordHash = passwordHash };

            using (var context = new ApplicationDbContext(_dbContextOptions))
            {
                context.Users.Add(user);
                await context.SaveChangesAsync();
            }

            _passwordServiceMock.Setup(p => p.VerifyPassword(password, passwordHash)).Returns(false);

            using (var context = new ApplicationDbContext(_dbContextOptions))
            {
                var authService = new AuthService(context, _passwordServiceMock.Object, _jwtServiceMock.Object, _loggerMock.Object);
                var loginDto = new LoginDto { Email = email, Password = password };

                // Act & Assert
                await Assert.ThrowsAsync<UnauthorizedAccessException>(() => authService.LoginAsync(loginDto));
            }
        }

        [Fact]
        public async Task RegisterAsync_NewUser_ReturnsAuthResponse()
        {
            // Arrange
            var registerDto = new RegisterDto
            {
                Email = "newuser@example.com",
                FirstName = "New",
                LastName = "User",
                Password = "Password123",
                ConfirmPassword = "Password123"
            };

            _passwordServiceMock.Setup(p => p.HashPassword(registerDto.Password)).Returns("hashed_password");
            _jwtServiceMock.Setup(j => j.GenerateToken(It.IsAny<User>())).Returns("test_token");

            using (var context = new ApplicationDbContext(_dbContextOptions))
            {
                var authService = new AuthService(context, _passwordServiceMock.Object, _jwtServiceMock.Object, _loggerMock.Object);

                // Act
                var result = await authService.RegisterAsync(registerDto);

                // Assert
                Assert.NotNull(result);
                Assert.Equal(registerDto.Email, result.Email);
                Assert.Equal("test_token", result.Token);
                
                var userInDb = await context.Users.FirstOrDefaultAsync(u => u.Email == registerDto.Email);
                Assert.NotNull(userInDb);
                Assert.Equal("hashed_password", userInDb.PasswordHash);
            }
        }

        [Fact]
        public async Task RegisterAsync_ExistingUser_ThrowsInvalidOperationException()
        {
            // Arrange
            var email = "existing@example.com";
            var user = new User { Email = email };

            using (var context = new ApplicationDbContext(_dbContextOptions))
            {
                context.Users.Add(user);
                await context.SaveChangesAsync();
            }

            var registerDto = new RegisterDto
            {
                Email = email,
                FirstName = "Existing",
                LastName = "User",
                Password = "Password123",
                ConfirmPassword = "Password123"
            };

            using (var context = new ApplicationDbContext(_dbContextOptions))
            {
                var authService = new AuthService(context, _passwordServiceMock.Object, _jwtServiceMock.Object, _loggerMock.Object);

                // Act & Assert
                await Assert.ThrowsAsync<InvalidOperationException>(() => authService.RegisterAsync(registerDto));
            }
        }
    }
}
