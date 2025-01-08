import React, { useState, useEffect, useRef } from 'react';
import Select from 'react-select';
import { BUS_STOP_LOCATIONS} from './data/busstops';
import { useLocation } from './locationContext';

interface LocationOption {
  label: string;
  secondaryLabel?: string;
  lat: number;
  lon: number;
}

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
  const [inputValue, setInputValue] = useState('');
  const [selectedValue, setSelectedValue] = useState<LocationSelectOption | null>(null);
  const [isAddressMode, setIsAddressMode] = useState(false);
  const { setLocation } = useLocation();
  console.log("📍 isLocationChanging in LocationDropdown:", isLocationChanging);
  const initializeDefaultRef = useRef(false);
  const onLocationChangeRef = useRef(onLocationChange);
const [addressSuggestions, setAddressSuggestions] = useState<Array<{
    value: { lat: number; lon: number; label: string };
    label: string;
    isCustomAddress: boolean;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    // We only want to run this once, so guard with a ref
    if (initializeDefaultRef.current) return;
  
    // Initially set from localStorage if it exists
    const cachedLocation = localStorage.getItem('selectedLocation');
    if (cachedLocation) {
      const parsedLocation = JSON.parse(cachedLocation);
      setSelectedValue(parsedLocation);
      setInputValue(parsedLocation.label || '');
  
      if (parsedLocation.value?.lat && parsedLocation.value?.lon) {
        onLocationChangeRef.current({
          lat: parsedLocation.value.lat,
          lon: parsedLocation.value.lon,
        });
        setLocation({
          lat: parsedLocation.value.lat,
          lon: parsedLocation.value.lon,
        });
      }
    } else {
      // If no saved location, use Union Square as fallback
      const defaultLocation = BUS_STOP_LOCATIONS[0];
      const defaultOption = {
        value: {
          lat: defaultLocation.lat,
          lon: defaultLocation.lon,
          label: defaultLocation.label,
        },
        label: defaultLocation.label,
        isCustomAddress: false,
      };
  
      setSelectedValue(defaultOption);
      setInputValue(defaultLocation.label);
      
      onLocationChangeRef.current({
        lat: defaultLocation.lat,
        lon: defaultLocation.lon,
      });
      setLocation({
        lat: defaultLocation.lat,
        lon: defaultLocation.lon,
      });
    }
  
    initializeDefaultRef.current = true;
  }, [setLocation]);

  useEffect(() => {
    onLocationChangeRef.current = onLocationChange;
  }, [onLocationChange]);

  useEffect(() => {
    localStorage.setItem('dropdownInputValue', inputValue);
  }, [inputValue]);
  useEffect(() => {
    const saved = localStorage.getItem('dropdownInputValue');
    if (saved) setInputValue(saved);
  }, []);
  // 🛠️ Load cached value from localStorage
  

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

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (inputValue.length > 3) {
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
  
          // If there's exactly one suggestion, use it automatically
          if (suggestions.length === 1) {
            const suggestion = suggestions[0];
            setSelectedValue(suggestion);
            setInputValue(suggestion.label); // Add this line
            localStorage.setItem('selectedLocation', JSON.stringify(suggestion));
            
            setLocation({
              lat: suggestion.value.lat,
              lon: suggestion.value.lon
            });
            
            onLocationChangeRef.current({
              lat: suggestion.value.lat,
              lon: suggestion.value.lon
            });
          }
        } catch (error) {
          console.error('Error fetching suggestions:', error);
        }
      } else {
        setAddressSuggestions([]);
      }
    };
  
    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [inputValue, setLocation]);

  const handleInputChange = (newVal: string, { action }: { action: string }) => {
    if (action === 'input-change') {
      // The user is typing text
      setInputValue(newVal);
    }
  };

  const handleSelectChange = (selectedOption: LocationSelectOption | null) => {
    setSelectedValue(selectedOption);
    if (selectedOption) {
      setInputValue(selectedOption.label); // Ensure inputValue updates with label
      localStorage.setItem('dropdownInputValue', selectedOption.label);
      localStorage.setItem('selectedLocation', JSON.stringify(selectedOption));
      
      setLocation({
        lat: selectedOption.value.lat,
        lon: selectedOption.value.lon
      });
      
      onLocationChangeRef.current({
        lat: selectedOption.value.lat,
        lon: selectedOption.value.lon
      });
    }
  };

  useEffect(() => {
    if (selectedValue) {
      setInputValue(selectedValue.label);
    }
  }, [selectedValue]);

  
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && addressSuggestions.length > 0) {
      const firstSuggestion = addressSuggestions[0];
      setSelectedValue(firstSuggestion);
      setInputValue(firstSuggestion.label);
      
      // Update both context and callback
      setLocation({
        lat: firstSuggestion.value.lat,
        lon: firstSuggestion.value.lon
      });
      
      onLocationChangeRef.current({
        lat: firstSuggestion.value.lat,
        lon: firstSuggestion.value.lon
      });
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
    
      if (isClosestStop && (isEstimatedBusLocation || isMTAProvided)) {
        backgroundColor = '#2684FF';
        color = 'white';
        fontWeight = 'bold';
      } else if (isEstimatedBusLocation && isMTAProvided) {
        backgroundColor = '#FFD700';
        color = 'black';
        fontWeight = 'bold';
      } else if (isClosestStop) {
        backgroundColor = '#2684FF';
        color = 'white';
        fontWeight = 'bold';
      } else if (isEstimatedBusLocation) {
        backgroundColor = '#FFD700';
        color = 'black';
        fontWeight = 'bold';
      } else if (isMTAProvided) {
        backgroundColor = '#FFFF00';
        color = 'black';
        fontWeight = 'bold';
      } else if (isSameAsCurrent) {
        backgroundColor = '#2684FF';
        color = 'white';
        fontWeight = 'bold';
      } else if (isSelected) {
        backgroundColor = '#2684FF';
        color = 'white';
      } else if (isFocused) {
        backgroundColor = '#f0f0f0';
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
      inputValue={inputValue}
      onChange={handleSelectChange}
      onInputChange={handleInputChange}
      onKeyDown={handleKeyDown}
      isLoading={isLoading}
      value={selectedValue}
      placeholder="Search location or address..."
      noOptionsMessage={() => null} // This will always show options
      onFocus={() => {
        // Only clear input if it's not the default Union Square location
        if (selectedValue?.label !== BUS_STOP_LOCATIONS[0].label) {
          setInputValue('');
        }
      }}
      filterOption={(option, input) => {
        if (!input) return true; // Show all options when no input
        return option.label.toLowerCase().includes(input.toLowerCase());
      }}
      className="location-dropdown"
      classNamePrefix="location-select"
      menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
      menuPosition="fixed"
    />
  );
};

export default React.memo(LocationDropdown);