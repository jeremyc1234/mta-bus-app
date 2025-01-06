import React, { useState, useEffect, useRef } from 'react';
import Select from 'react-select';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

interface LocationOption {
  label: string;
  secondaryLabel?: string;
  lat: number;  // Removed null
  lon: number;  // Removed null
}

// The LocationValue interface remains the same
interface LocationValue {
  lat: number;
  lon: number;
  label: string;
}

interface LocationSelectOption {
  value: LocationValue;
  label: string;
  isCustomAddress?: boolean;
  isAddressSearch?: boolean;
}

const BUS_STOP_LOCATIONS: LocationOption[] = [
    // Manhattan
    { label: "Union Square", secondaryLabel: "default", lat: 40.7359, lon: -73.9906 },
    { label: "Times Square", lat: 40.7580, lon: -73.9855 },
    { label: "Central Park", lat: 40.7851, lon: -73.9683 },
    { label: "Empire State Building", lat: 40.7488, lon: -73.9857 },
    { label: "Wall Street", lat: 40.7074, lon: -74.0113 },
    { label: "Grand Central Terminal", lat: 40.7527, lon: -73.9772 },
    { label: "Rockefeller Center", lat: 40.7587, lon: -73.9787 },
    { label: "One World Trade Center", lat: 40.7127, lon: -74.0134 },
    { label: "The High Line", lat: 40.7479, lon: -74.0048 },
    { label: "Bryant Park", lat: 40.7536, lon: -73.9832 },
    { label: "St. Patrick's Cathedral", lat: 40.7585, lon: -73.9759 },
    { label: "Fifth Avenue Shopping District", lat: 40.7603, lon: -73.9755 },
    { label: "Chrysler Building", lat: 40.7516, lon: -73.9755 },
    { label: "Metropolitan Museum of Art", lat: 40.7794, lon: -73.9632 },
    { label: "American Museum of Natural History", lat: 40.7813, lon: -73.9730 },
    { label: "Museum of Modern Art (MoMA)", lat: 40.7614, lon: -73.9776 },
    { label: "Broadway Theater District", lat: 40.7590, lon: -73.9845 },
    { label: "Madison Square Garden", lat: 40.7505, lon: -73.9934 },
    { label: "Little Italy", lat: 40.7191, lon: -73.9973 },
    { label: "Chinatown", lat: 40.7158, lon: -73.9970 },
    { label: "Battery Park", lat: 40.7033, lon: -74.0170 },
    { label: "Chelsea Market", lat: 40.7424, lon: -74.0060 },
    { label: "SoHo", lat: 40.7233, lon: -74.0020 },
    { label: "Washington Square Park", lat: 40.7308, lon: -73.9973 },
  
    // Brooklyn
    { label: "Brooklyn Bridge", lat: 40.7061, lon: -73.9969 },
    { label: "Prospect Park", lat: 40.6602, lon: -73.9690 },
    { label: "Brooklyn Museum", lat: 40.6712, lon: -73.9636 },
    { label: "DUMBO", lat: 40.7033, lon: -73.9894 },
    { label: "Coney Island", lat: 40.5749, lon: -73.9850 },
    { label: "Barclays Center", lat: 40.6826, lon: -73.9752 },
    { label: "Brooklyn Botanic Garden", lat: 40.6676, lon: -73.9632 },
  
    // Queens
    { label: "Flushing Meadows-Corona Park", lat: 40.7498, lon: -73.8408 },
    { label: "Citi Field", lat: 40.7571, lon: -73.8458 },
    { label: "Astoria Park", lat: 40.7795, lon: -73.9220 },
    { label: "Rockaway Beach", lat: 40.5795, lon: -73.8351 },
    { label: "JFK Airport", lat: 40.6413, lon: -73.7781 },
    { label: "Gantry Plaza State Park", lat: 40.7479, lon: -73.9565 },
  
    // The Bronx
    { label: "Yankee Stadium", lat: 40.8296, lon: -73.9262 },
    { label: "Bronx Zoo", lat: 40.8506, lon: -73.8769 },
    { label: "New York Botanical Garden", lat: 40.8623, lon: -73.8770 },
    { label: "Fordham University", lat: 40.8610, lon: -73.8857 },
    { label: "Pelham Bay Park", lat: 40.8719, lon: -73.8065 },
  
    // Staten Island
    { label: "Staten Island Ferry Terminal", lat: 40.6437, lon: -74.0733 },
    { label: "Staten Island Zoo", lat: 40.6257, lon: -74.1152 },
    { label: "Richmond Town", lat: 40.5706, lon: -74.1455 },

    { label: "Roosevelt Island Tramway", lat: 40.7614, lon: -73.9493 },
  ];
  
  
  interface LocationDropdownProps {
    selectedStop?: string | null;
    onLocationChange: (newLocation: { lat: number | null; lon: number | null }) => void;
    isLocationChanging: boolean;
    setIsLocationChanging: (value: boolean) => void;
  }  

  const LocationDropdown: React.FC<LocationDropdownProps> = ({ 
    onLocationChange,
    isLocationChanging,
    setIsLocationChanging
  }) => {
    console.log("📍 isLocationChanging in LocationDropdown:", isLocationChanging);

  const onLocationChangeRef = useRef(onLocationChange);

  useEffect(() => {
    onLocationChangeRef.current = onLocationChange;
  }, [onLocationChange]);

  const [inputValue, setInputValue] = useState('');
  const [selectedValue, setSelectedValue] = useState<LocationSelectOption | null>(null);
  const [isAddressMode, setIsAddressMode] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<Array<{
    value: { lat: number; lon: number; label: string };
    label: string;
    isCustomAddress: boolean;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const updateURL = (newLocation: any, isCustomAddress: boolean) => {
    const url = new URL(window.location.href);
    
    // Clear existing params
    url.searchParams.delete('lat');
    url.searchParams.delete('lon');
    url.searchParams.delete('address');
    url.searchParams.delete('location');
    url.searchParams.delete('timestamp');
  
    // Add new params
    if (isCustomAddress) {
      url.searchParams.set('lat', newLocation.value.lat.toString());
      url.searchParams.set('lon', newLocation.value.lon.toString());
      url.searchParams.set('address', newLocation.value.label);
    } else {
      url.searchParams.set('location', newLocation.value.label);
      url.searchParams.set('lat', newLocation.value.lat.toString());
      url.searchParams.set('lon', newLocation.value.lon.toString());
    }
  
    // Add timestamp
    url.searchParams.set('timestamp', Date.now().toString());
  
    // Update URL with page reload and add to browser history
    window.history.pushState(
      { 
        lat: newLocation.value.lat,
        lon: newLocation.value.lon,
        type: isCustomAddress ? 'address' : 'location',
        label: newLocation.value.label,
        timestamp: Date.now()
      }, 
      document.title, 
      url.toString()
    );
  };

  // 🛠️ Load cached value from localStorage
  useEffect(() => {
    const cachedLocation = localStorage.getItem('selectedLocation');
    if (cachedLocation) {
      const parsedLocation = JSON.parse(cachedLocation);
      setSelectedValue(parsedLocation);

      if (parsedLocation.value?.lat && parsedLocation.value?.lon) {
        onLocationChangeRef.current({
          lat: parsedLocation.value.lat,
          lon: parsedLocation.value.lon,
        });
      }
    }
  }, []);

  const locationOptions = BUS_STOP_LOCATIONS
  .filter((location): location is LocationOption & { lat: number; lon: number } => 
    location.lat !== null && location.lon !== null
  )
  .map((location) => ({
    value: {
      lat: location.lat,
      lon: location.lon,
      label: location.label
    },
    label: location.label,
    isAddressSearch: false
  }));
  
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const locationParam = searchParams.get('location');
    const addressParam = searchParams.get('address');
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
  
    if (locationParam) {
      const predefinedLocation = BUS_STOP_LOCATIONS.find(
        loc => loc.label === decodeURIComponent(locationParam)
      );
      
      if (predefinedLocation) {
        setSelectedValue({
          value: predefinedLocation,
          label: predefinedLocation.label,
          isCustomAddress: false
        });
  
        onLocationChangeRef.current({
          lat: predefinedLocation.lat,
          lon: predefinedLocation.lon
        });
      }
    } else if (addressParam && lat && lon) {
      setSelectedValue({
        value: {
          lat: parseFloat(lat),
          lon: parseFloat(lon),
          label: decodeURIComponent(addressParam)
        },
        label: decodeURIComponent(addressParam),
        isCustomAddress: true
      });
  
      onLocationChangeRef.current({
        lat: parseFloat(lat),
        lon: parseFloat(lon)
      });
    } else {
      // Set Union Square as default if no location is specified
      const defaultLocation = BUS_STOP_LOCATIONS[0];
      setSelectedValue({
        value: defaultLocation,
        label: defaultLocation.label,
        isCustomAddress: false
      });
  
      onLocationChangeRef.current({
        lat: defaultLocation.lat,
        lon: defaultLocation.lon
      });
    }
  }, [searchParams]);

  // Then modify the useEffect for fetching suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (isAddressMode && inputValue.length > 3) {
        setIsLoading(true);
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?` +
              new URLSearchParams({
                q: inputValue + ' New York',
                format: 'json',
                countrycodes: 'us',
                limit: '5',
                addressdetails: '1'
              })
          );
          const data = await response.json();
          const suggestions = data.map((item: any) => ({
            value: {
              lat: parseFloat(item.lat),
              lon: parseFloat(item.lon),
              label: item.display_name
            },
            label: item.display_name,
            isCustomAddress: true
          }));
          setAddressSuggestions(suggestions);
  
          if (suggestions.length === 1) {
            const suggestion = suggestions[0];
            setSelectedValue(suggestion);
            localStorage.setItem('selectedLocation', JSON.stringify(suggestion));
            
            const url = new URL(window.location.href);
            url.searchParams.delete('lat');
            url.searchParams.delete('lon');
            url.searchParams.delete('address');
            url.searchParams.delete('location');
            
            url.searchParams.set('lat', suggestion.value.lat.toString());
            url.searchParams.set('lon', suggestion.value.lon.toString());
            url.searchParams.set('address', suggestion.value.label);
            
            router.replace(url.pathname + url.search);
  
            onLocationChangeRef.current({
              lat: suggestion.value.lat,
              lon: suggestion.value.lon
            });
          }
        } catch (error) {
          console.error('❌ Error fetching suggestions:', error);
        }
        setIsLoading(false);
      } else {
        setAddressSuggestions([]);
      }
    };
  
    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [inputValue, isAddressMode, pathname, router]);

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    setIsAddressMode(true);
  };

  const handleSelectChange = (selectedOption: LocationSelectOption | null) => {
    setSelectedValue(selectedOption);
    
    if (selectedOption && selectedOption.value && 
        typeof selectedOption.value.lat === 'number' && 
        typeof selectedOption.value.lon === 'number') {
      setIsLocationChanging(true);
      
      setTimeout(() => {
        onLocationChangeRef.current({
          lat: selectedOption.value.lat,
          lon: selectedOption.value.lon,
        });
        
        const url = new URL(window.location.href);
        
        // Clear existing params
        url.searchParams.delete('lat');
        url.searchParams.delete('lon');
        url.searchParams.delete('address');
        url.searchParams.delete('location');
        
        // Add new params
        if (selectedOption.isCustomAddress) {
          url.searchParams.set('lat', selectedOption.value.lat.toString());
          url.searchParams.set('lon', selectedOption.value.lon.toString());
          url.searchParams.set('address', selectedOption.value.label);
        } else {
          url.searchParams.set('location', selectedOption.value.label);
          url.searchParams.set('lat', selectedOption.value.lat.toString());
          url.searchParams.set('lon', selectedOption.value.lon.toString());
        }
        
        // Only use timestamp for state, not URL
        const timestamp = Date.now();
        
        // Use pushState to create a new history entry
        window.history.pushState(
          { 
            lat: selectedOption.value.lat,
            lon: selectedOption.value.lon,
            type: selectedOption.isCustomAddress ? 'address' : 'location',
            label: selectedOption.value.label,
            timestamp
          }, 
          '', 
          url.toString()
        );
      }, 100);
    }
  };
  
  
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && addressSuggestions.length > 0) {
      const firstSuggestion = addressSuggestions[0];
      setSelectedValue(firstSuggestion);
      
      onLocationChangeRef.current({
        lat: firstSuggestion.value.lat,
        lon: firstSuggestion.value.lon
      });
  
      // Update URL with new location
      updateURL(firstSuggestion, true);
    }
  };
  const allOptions = [
    ...locationOptions.filter(opt => !opt.isAddressSearch),
    ...(addressSuggestions.length > 0
      ? [{ label: 'Custom Addresses', options: addressSuggestions }]
      : [])
  ];

  const customStyles = {
    control: (provided: any) => ({
      ...provided,
      width: '300px',
      borderRadius: '8px',
      border: '1px solid #ccc',
      boxShadow: 'none',
      '&:hover': { border: '1px solid #2684FF' }
    }),
    menuPortal: (base: any) => ({
      ...base,
      zIndex: 9999,
    }),
    singleValue: (provided: any) => ({
      ...provided,
      maxWidth: '100%',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }),
    menu: (provided: any) => ({
      ...provided,
      borderRadius: '8px',
      boxShadow: '0 4px 11px rgba(0, 0, 0, 0.1)'
    }),
    option: (provided: any, { isSelected, isFocused, data }: any) => {
      const isSameAsCurrent = selectedValue?.value?.lat === data.value.lat &&
                              selectedValue?.value?.lon === data.value.lon;
    
      const isClosestStop = data.label.includes('Closest stop to you');
      const isEstimatedBusLocation = data.label.includes('Our estimated bus location');
      const isMTAProvided = data.label.includes('MTA provided bus location');
    
      let backgroundColor = 'white';
      let color = 'black';
      let fontWeight = 'normal';
    
      // Check combinations first
      if (isClosestStop && (isEstimatedBusLocation || isMTAProvided)) {
        // If closest stop is combined with either estimated or MTA location
        backgroundColor = '#2684FF'; // Blue
        color = 'white';
        fontWeight = 'bold';
      } else if (isEstimatedBusLocation && isMTAProvided) {
        // If estimated location and MTA location are at same stop
        backgroundColor = '#FFD700'; // Gold
        color = 'black';
        fontWeight = 'bold';
      } else if (isClosestStop) {
        // Individual closest stop
        backgroundColor = '#2684FF'; // Blue
        color = 'white';
        fontWeight = 'bold';
      } else if (isEstimatedBusLocation) {
        // Individual estimated location
        backgroundColor = '#FFD700'; // Gold
        color = 'black';
        fontWeight = 'bold';
      } else if (isMTAProvided) {
        // Individual MTA location
        backgroundColor = '#FFFF00'; // Yellow
        color = 'black';
        fontWeight = 'bold';
      } else if (isSameAsCurrent) {
        backgroundColor = '#2684FF'; // Blue for current selected location
        color = 'white';
        fontWeight = 'bold';
      } else if (isSelected) {
        backgroundColor = '#2684FF'; // Blue for any selected option
        color = 'white';
      } else if (isFocused) {
        backgroundColor = '#f0f0f0'; // Light gray for hover
      }
    
      return {
        ...provided,
        backgroundColor,
        color,
        fontWeight
      };
    }
  };  

  return (
    <Select
      options={allOptions}
      styles={customStyles}
      onChange={handleSelectChange}
      onInputChange={handleInputChange}
      onKeyDown={handleKeyDown}
      isLoading={isLoading}
      value={selectedValue}
      placeholder="Search location or address..."
      noOptionsMessage={() =>
        inputValue.length > 0
          ? 'Type more to search for an address...'
          : 'No locations found'
      }
      className="location-dropdown"
      classNamePrefix="location-select"
      menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
      menuPosition="fixed"
    />
  );
};

export default React.memo(LocationDropdown);