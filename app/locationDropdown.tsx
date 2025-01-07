import React, { useState, useEffect, useRef } from 'react';
import Select from 'react-select';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { BUS_STOP_LOCATIONS} from './data/busstops';

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
    
    if (selectedOption?.value && 
        typeof selectedOption.value.lat === 'number' && 
        typeof selectedOption.value.lon === 'number') {
      setIsLocationChanging(true);
      
      // Remove the setTimeout and call immediately
      onLocationChangeRef.current({
        lat: selectedOption.value.lat,
        lon: selectedOption.value.lon,
      });
      
      // Update URL
      const url = new URL(window.location.href);
      url.searchParams.delete('lat');
      url.searchParams.delete('lon');
      url.searchParams.delete('address');
      url.searchParams.delete('location');
      
      if (selectedOption.isCustomAddress) {
        url.searchParams.set('lat', selectedOption.value.lat.toString());
        url.searchParams.set('lon', selectedOption.value.lon.toString());
        url.searchParams.set('address', selectedOption.value.label);
      } else {
        url.searchParams.set('location', selectedOption.value.label);
        url.searchParams.set('lat', selectedOption.value.lat.toString());
        url.searchParams.set('lon', selectedOption.value.lon.toString());
      }
      
      window.history.pushState(
        { 
          lat: selectedOption.value.lat,
          lon: selectedOption.value.lon,
          type: selectedOption.isCustomAddress ? 'address' : 'location',
          label: selectedOption.value.label,
          timestamp: Date.now()
        }, 
        '', 
        url.toString()
      );
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