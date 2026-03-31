DELETE FROM RoomAmenities;

ALTER TABLE RoomAmenities DROP COLUMN Name;
ALTER TABLE RoomAmenities DROP COLUMN IconUrl;

ALTER TABLE RoomAmenities ADD AmenityId int NOT NULL;
ALTER TABLE RoomAmenities ADD CONSTRAINT FK_RoomAmenities_Amenities_AmenityId FOREIGN KEY (AmenityId) REFERENCES Amenities(Id) ON DELETE CASCADE;
CREATE INDEX IX_RoomAmenities_AmenityId ON RoomAmenities (AmenityId);
