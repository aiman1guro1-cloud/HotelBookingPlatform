using AutoMapper;
using HotelBookingPlatform.Core.Entities;
using HotelBookingPlatform.Core.DTOs;
using HotelBookingPlatform.Core.Enums;  // ADD THIS LINE

namespace HotelBookingPlatform.Server.Mappings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // User mappings
        CreateMap<User, UserProfileDto>();
        CreateMap<UpdateUserProfileDto, User>();
        CreateMap<UserPaymentMethod, UserPaymentMethodDto>();
        CreateMap<AddPaymentMethodDto, UserPaymentMethod>();

        // Hotel mappings
        CreateMap<Hotel, HotelDto>()
            .ForMember(dest => dest.PricePerNight,
                opt => opt.MapFrom(src => src.Rooms.Any() ? src.Rooms.Min(r => r.PricePerNight) : 0))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()));

        CreateMap<Hotel, HotelDetailDto>()
            .ForMember(dest => dest.Amenities,
                opt => opt.MapFrom(src => src.Amenities.Select(a => a.Name).ToList()))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.Rooms, opt => opt.MapFrom(src => src.Rooms))
            .ForMember(dest => dest.PricePerNight,
                opt => opt.MapFrom(src => src.Rooms.Any() ? src.Rooms.Min(r => r.PricePerNight) : 0));

        // Room mappings
        CreateMap<Room, RoomDto>()
            .ForMember(dest => dest.IsAvailable,
                opt => opt.MapFrom(src => src.Status == RoomStatus.Available));  // Now Enums is recognized

        CreateMap<Room, RoomDetailDto>()
            .IncludeBase<Room, RoomDto>()
            .ForMember(dest => dest.Amenities,
                opt => opt.MapFrom(src => src.RoomAmenities.Select(ra => ra.Amenity != null ? ra.Amenity.Name : string.Empty).ToList()));

        // Review mappings
        CreateMap<Review, ReviewDto>()
            .ForMember(dest => dest.UserName,
                opt => opt.MapFrom(src => src.User != null ? $"{src.User.FirstName} {src.User.LastName}" : "Anonymous"));

        // Booking mappings
        CreateMap<Booking, BookingResponseDto>()
            .ForMember(dest => dest.HotelName,
                opt => opt.MapFrom(src => src.Room != null && src.Room.Hotel != null ? src.Room.Hotel.Name : string.Empty))
            .ForMember(dest => dest.RoomNumber,
                opt => opt.MapFrom(src => src.Room != null ? src.Room.RoomNumber : string.Empty))
            .ForMember(dest => dest.Status,
                opt => opt.MapFrom(src => src.Status.ToString()));

        // Admin booking mapping (includes guest identity)
        CreateMap<Booking, AdminBookingResponseDto>()
            .ForMember(dest => dest.GuestName,
                opt => opt.MapFrom(src => src.User != null ? $"{src.User.FirstName} {src.User.LastName}" : "Unknown"))
            .ForMember(dest => dest.GuestEmail,
                opt => opt.MapFrom(src => src.User != null ? src.User.Email : string.Empty))
            .ForMember(dest => dest.HotelName,
                opt => opt.MapFrom(src => src.Room != null && src.Room.Hotel != null ? src.Room.Hotel.Name : string.Empty))
            .ForMember(dest => dest.RoomType,
                opt => opt.MapFrom(src => src.Room != null ? src.Room.RoomType : string.Empty))
            .ForMember(dest => dest.RoomNumber,
                opt => opt.MapFrom(src => src.Room != null ? src.Room.RoomNumber : string.Empty))
            .ForMember(dest => dest.Status,
                opt => opt.MapFrom(src => src.Status.ToString()));
    }
}