import React from "react";

export interface TileCardProps {
  children: React.ReactNode;
  className?: string;
}

const TileCard: React.FC<TileCardProps> = ({ children, className }) => (
  <div
    className={className}
    style={{
      background: "#ffffff",
      border: "0.5px solid #e0e3ea",
      borderRadius: 14,
      overflow: "hidden",
    }}
  >
    {children}
  </div>
);

export default TileCard;
