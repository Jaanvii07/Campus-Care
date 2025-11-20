import { useState } from 'react';
import { cn } from "@/lib/utils";

// Define the locations and their responsible departments
const locations = {
  "library": { name: "Main Library", department: "Library" },
  "hostel-a": { name: "Hostel A", department: "Hostel" },
  "hostel-b": { name: "Hostel B", department: "Hostel" },
  "admin-building": { name: "Admin Building", department: "Maintenance" },
  "it-center": { name: "IT Center", department: "IT Services" },
  "quad": { name: "Central Quad", department: "Maintenance" },
};

// Define colors for each department
const departmentColors = {
  "Library": "fill-blue-500",
  "Hostel": "fill-green-500",
  "Maintenance": "fill-amber-500",
  "IT Services": "fill-indigo-500",
  "default": "fill-muted-foreground/30"
};

// Helper to get the color for a location
const getLocationColor = (locationId: string) => {
  const location = locations[locationId as keyof typeof locations];
  if (location && departmentColors[location.department as keyof typeof departmentColors]) {
    return departmentColors[location.department as keyof typeof departmentColors];
  }
  return departmentColors.default;
};

// Helper to get the zone from a specific room ID
export const getZone = (locationId: string | null) : string | null => {
    if (!locationId) return null;
    if (locationId.startsWith('library')) return 'library';
    if (locationId.startsWith('hostel-a')) return 'hostel-a';
    if (locationId.startsWith('hostel-b')) return 'hostel-b';
    if (locationId.startsWith('admin')) return 'admin-building';
    if (locationId.startsWith('it-')) return 'it-center';
    if (locationId.startsWith('quad')) return 'quad';
    return null;
}

interface CampusMapProps {
  onLocationSelect?: (locationId: string) => void;
  selectedLocation?: string | null;
  interactive?: boolean;
  highlightedLocation?: string | null;
  onZoneHover?: (zoneId: string | null) => void; // <-- NEW
}

export const CampusMap = ({ 
  onLocationSelect, 
  selectedLocation, 
  interactive = false,
  highlightedLocation,
  onZoneHover 
}: CampusMapProps) => {
  
  const [hovered, setHovered] = useState<string | null>(null);

  const handleClick = (locationId: string) => {
    if (interactive && onLocationSelect) {
      onLocationSelect(locationId);
    }
  };

  const handleHover = (zoneId: string | null) => {
    setHovered(zoneId);
    if (onZoneHover) {
      onZoneHover(zoneId);
    }
  }
  
  const activeZone = getZone(highlightedLocation);

  return (
    <div className="w-full aspect-video p-4 border rounded-lg bg-background overflow-hidden relative">
      <svg viewBox="0 0 400 300" className="w-full h-full">
        {/* Background */}
        <rect width="400" height="300" fill="hsl(var(--muted) / 0.1)" />

        {/* Location: Admin Building */}
        <rect 
          id="admin-building"
          x="20" y="20" width="120" height="60"
          className={cn("transition-all duration-200 ease-in-out",
            interactive && "cursor-pointer",
            activeZone === 'admin-building' ? 'stroke-primary stroke-2 scale-105' : 'stroke-border',
            getLocationColor('admin-building')
          )}
          onClick={() => handleClick('admin-building')}
          onMouseEnter={() => handleHover('admin-building')}
          onMouseLeave={() => handleHover(null)}
        />

        {/* Location: IT Center */}
        <rect 
          id="it-center"
          x="20" y="100" width="120" height="40"
          className={cn("transition-all duration-200 ease-in-out",
            interactive && "cursor-pointer",
            activeZone === 'it-center' ? 'stroke-primary stroke-2 scale-105' : 'stroke-border',
            getLocationColor('it-center')
          )}
          onClick={() => handleClick('it-center')}
          onMouseEnter={() => handleHover('it-center')}
          onMouseLeave={() => handleHover(null)}
        />

        {/* Location: Library */}
        <rect 
          id="library"
          x="160" y="20" width="220" height="120"
          className={cn("transition-all duration-200 ease-in-out",
            interactive && "cursor-pointer",
            activeZone === 'library' ? 'stroke-primary stroke-2 scale-105' : 'stroke-border',
            getLocationColor('library')
          )}
          onClick={() => handleClick('library')}
          onMouseEnter={() => handleHover('library')}
          onMouseLeave={() => handleHover(null)}
        />

        {/* Location: Hostel A */}
        <rect 
          id="hostel-a"
          x="20" y="160" width="160" height="120"
          className={cn("transition-all duration-200 ease-in-out",
            interactive && "cursor-pointer",
            activeZone === 'hostel-a' ? 'stroke-primary stroke-2 scale-105' : 'stroke-border',
            getLocationColor('hostel-a')
          )}
          onClick={() => handleClick('hostel-a')}
          onMouseEnter={() => handleHover('hostel-a')}
          onMouseLeave={() => handleHover(null)}
        />

        {/* Location: Hostel B */}
        <rect 
          id="hostel-b"
          x="220" y="160" width="160" height="120"
          className={cn("transition-all duration-200 ease-in-out",
            interactive && "cursor-pointer",
            activeZone === 'hostel-b' ? 'stroke-primary stroke-2 scale-105' : 'stroke-border',
            getLocationColor('hostel-b')
          )}
          onClick={() => handleClick('hostel-b')}
          onMouseEnter={() => handleHover('hostel-b')}
          onMouseLeave={() => handleHover(null)}
        />

        {/* Location: Quad */}
        <rect 
          id="quad"
          x="185" y="145" width="30" height="30"
          transform="rotate(45 200 160)"
          className={cn("transition-all duration-200 ease-in-out",
            interactive && "cursor-pointer",
            activeZone === 'quad' ? 'stroke-primary stroke-2 scale-105' : 'stroke-border',
            getLocationColor('quad')
          )}
          onClick={() => handleClick('quad')}
          onMouseEnter={() => handleHover('quad')}
          onMouseLeave={() => handleHover(null)}
        />
        
        {/* Labels for the map */}
        <text x="80" y="55" textAnchor="middle" className="font-bold fill-white text-xs pointer-events-none">Admin</text>
        <text x="80" y="125" textAnchor="middle" className="font-bold fill-white text-xs pointer-events-none">IT Center</text>
        <text x="270" y="85" textAnchor="middle" className="font-bold fill-white text-lg pointer-events-none">Library</text>
        <text x="100" y="225" textAnchor="middle" className="font-bold fill-white text-lg pointer-events-none">Hostel A</text>
        <text x="300" y="225" textAnchor="middle" className="font-bold fill-white text-lg pointer-events-none">Hostel B</text>
        <text x="200" y="167" textAnchor="middle" className="font-bold fill-white text-[10px] pointer-events-none">Quad</text>
      </svg>
      
      {/* Tooltip for student view */}
      {interactive && (hovered || selectedLocation) && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground px-3 py-1.5 rounded-lg shadow-lg text-sm font-medium">
          {locations[(hovered || selectedLocation) as keyof typeof locations]?.name || 'Select a location'}
        </div>
      )}
    </div>
  );
};