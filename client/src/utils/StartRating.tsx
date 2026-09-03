import React, { useState } from 'react';
import { IoIosStar, IoIosStarOutline } from "react-icons/io";

interface StarRatingProps {
  rating: number;                    // Current rating value (0-5)
  handleRatingChange?: (rating: number) => void; // Callback when star is clicked
  readOnly?: boolean;                // If true, stars are not clickable
  size?: number;                     // Custom icon size (default: 20px)
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  handleRatingChange,
  readOnly = false,
  size = 20,
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  const handleMouseEnter = (star: number) => {
    if (!readOnly && handleRatingChange) {
      setHoverRating(star);
    }
  };

  const handleMouseLeave = () => {
    if (!readOnly && handleRatingChange) {
      setHoverRating(0);
    }
  };

  const handleClick = (star: number) => {
    if (!readOnly && handleRatingChange) {
      handleRatingChange(star);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => handleClick(star)}
          onMouseEnter={() => handleMouseEnter(star)}
          onMouseLeave={handleMouseLeave}
          disabled={readOnly || !handleRatingChange}
          className={`border-none p-0 focus:outline-none transition-colors ${
            readOnly || !handleRatingChange ? 'cursor-default' : 'cursor-pointer'
          }`}
          style={{ width: size, height: size }}
        >
          {star <= displayRating ? (
            <IoIosStar
              className="text-yellow-500"
              style={{ width: size, height: size }}
            />
          ) : (
            <IoIosStarOutline
              className="text-yellow-500"
              style={{ width: size, height: size }}
            />
          )}
        </button>
      ))}
    </div>
  );
};

export default StarRating;