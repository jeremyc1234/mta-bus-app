// import React, { useState, useEffect, useRef } from 'react';
// import Select from 'react-select';
// import { BUS_STOP_LOCATIONS} from './data/busstops';
// import { useLocation } from './locationContext';

// interface LocationOption {
//   label: string;
//   secondaryLabel?: string;
//   lat: number;
//   lon: number;
// }

// interface LocationValue {
//   lat: number;
//   lon: number;
//   label: string;
// }

// interface LocationSelectOption {
//   value: LocationValue;
//   label: string;
//   isCustomAddress?: boolean;
//   isAddressSearch?: boolean;
// }
  
// interface LocationDropdownProps {
//   selectedStop?: string | null;
//   onLocationChange: (newLocation: { lat: number | null; lon: number | null }) => void;
//   isLocationChanging: boolean;
//   setIsLocationChanging: (value: boolean) => void;
// }  

// const LocationDropdown: React.FC<LocationDropdownProps> = ({ 
//   onLocationChange,
//   isLocationChanging,
//   setIsLocationChanging
// }) => {
//   const [inputValue, setInputValue] = useState('');
//   const [selectedValue, setSelectedValue] = useState<LocationSelectOption | null>(() => {
//     if (typeof window !== 'undefined') {
//       const savedLocation = localStorage.getItem('selectedLocation');
//       return savedLocation ? JSON.parse(savedLocation) : null;
//     }
//     return null;
//   });
//   const [isAddressMode, setIsAddressMode] = useState(false);
//   const { setLocation } = useLocation();
//   // console.log("📍 isLocationChanging in LocationDropdown:", isLocationChanging);
//   const initializeDefaultRef = useRef(false);
//   const onLocationChangeRef = useRef(onLocationChange);
//   const [menuIsOpen, setMenuIsOpen] = useState(false);
//   const lastUpdateRef = useRef<number>(0);
// const THROTTLE_MS = 1000; // Minimum time between updates
// const [addressSuggestions, setAddressSuggestions] = useState<Array<{
//     value: { lat: number; lon: number; label: string };
//     label: string;
//     isCustomAddress: boolean;
//   }>>([]);
//   const [isLoading, setIsLoading] = useState(false);
//   useEffect(() => {
//     // We only want to run this once, so guard with a ref
//     if (initializeDefaultRef.current) return;
  
//     // Initially set from localStorage if it exists
//     const cachedLocation = localStorage.getItem('selectedLocation');
//     if (cachedLocation) {
//       const parsedLocation = JSON.parse(cachedLocation);
//       setSelectedValue(parsedLocation);
//       setInputValue(parsedLocation.label || '');
  
//       if (parsedLocation.value?.lat && parsedLocation.value?.lon) {
//         onLocationChangeRef.current({
//           lat: parsedLocation.value.lat,
//           lon: parsedLocation.value.lon,
//         });
//         setLocation({
//           lat: parsedLocation.value.lat,
//           lon: parsedLocation.value.lon,
//         });
//       }
//     } else {
//       // If no saved location, use Union Square as fallback
//       const defaultLocation = BUS_STOP_LOCATIONS[0];
//       const defaultOption = {
//         value: {
//           lat: defaultLocation.lat,
//           lon: defaultLocation.lon,
//           label: defaultLocation.label,
//         },
//         label: defaultLocation.label,
//         isCustomAddress: false,
//       };
  
//       setSelectedValue(defaultOption);
//       setInputValue(defaultLocation.label);
      
//       onLocationChangeRef.current({
//         lat: defaultLocation.lat,
//         lon: defaultLocation.lon,
//       });
//       setLocation({
//         lat: defaultLocation.lat,
//         lon: defaultLocation.lon,
//       });
//     }
  
//     initializeDefaultRef.current = true;
//   }, [setLocation]);

//   const isTouchDevice = () => {
//     return (('ontouchstart' in window) ||
//             (navigator.maxTouchPoints > 0));
//   };

//   useEffect(() => {
//     onLocationChangeRef.current = onLocationChange;
//   }, [onLocationChange]);

//   useEffect(() => {
//     localStorage.setItem('dropdownInputValue', inputValue);
//   }, [inputValue]);
//   useEffect(() => {
//     const saved = localStorage.getItem('dropdownInputValue');
//     if (saved) setInputValue(saved);
//   }, []);
//   // 🛠️ Load cached value from localStorage
  

//   const locationOptions = BUS_STOP_LOCATIONS
//     .filter((location): location is LocationOption & { lat: number; lon: number } => 
//       location.lat !== null && location.lon !== null
//     )
//     .map((location) => ({
//       value: {
//         lat: location.lat,
//         lon: location.lon,
//         label: location.label
//       },
//       label: location.label,
//       isAddressSearch: false
//     }));

//   useEffect(() => {
//     const fetchSuggestions = async () => {
//       if (inputValue.length > 3) {
//         try {
//           const response = await fetch(
//             `https://nominatim.openstreetmap.org/search?` +
//             new URLSearchParams({
//               q: inputValue + ' New York',
//               format: 'json',
//               countrycodes: 'us',
//               limit: '5',
//               addressdetails: '1'
//             })
//           );
//           const data = await response.json();
//           const suggestions = data.map((item: any) => ({
//             value: {
//               lat: parseFloat(item.lat),
//               lon: parseFloat(item.lon),
//               label: item.display_name
//             },
//             label: item.display_name,
//             isCustomAddress: true
//           }));
//           setAddressSuggestions(suggestions);
  
//           // If there's exactly one suggestion, use it automatically
//           if (suggestions.length === 1) {
//             const suggestion = suggestions[0];
//             setSelectedValue(suggestion);
//             setInputValue(suggestion.label); // Add this line
//             localStorage.setItem('selectedLocation', JSON.stringify(suggestion));
            
//             setLocation({
//               lat: suggestion.value.lat,
//               lon: suggestion.value.lon
//             });
            
//             onLocationChangeRef.current({
//               lat: suggestion.value.lat,
//               lon: suggestion.value.lon
//             });
//           }
//         } catch (error) {
//           console.error('Error fetching suggestions:', error);
//         }
//       } else {
//         setAddressSuggestions([]);
//       }
//     };
  
//     const timeoutId = setTimeout(fetchSuggestions, 300);
//     return () => clearTimeout(timeoutId);
//   }, [inputValue, setLocation]);

//   const handleInputChange = (newVal: string, { action }: { action: string }) => {
//     if (action === "input-change") {
//       setInputValue(newVal);
//       setMenuIsOpen(true); // Open the dropdown when input changes
//     } else if (action === "clear") {
//       setInputValue(""); 
//       setSelectedValue(null);
//       setMenuIsOpen(true); // Keep the menu open when clearing
//     }
//   };

//   const ClearIndicator = (props: any) => {
//   const { innerRef, innerProps } = props;

//   return (
//     <div
//       {...innerProps}
//       ref={innerRef}
//       style={{
//         cursor: "pointer",
//         padding: "0 8px",
//         fontSize: "1.2rem",
//         color: "#888",
//       }}
//       title="Clear"
//       onClick={() => handleInputChange("", { action: "clear" })}
//     >
//       ×
//     </div>
//   );
// };
  

// const handleSelectChange = async (selectedOption: LocationSelectOption | null) => {
//   if (selectedOption) {
//     const now = Date.now();
//     // Throttle updates
//     if (now - lastUpdateRef.current < THROTTLE_MS) {
//       console.log('🛑 Throttling location update');
//       return;
//     }
//     lastUpdateRef.current = now;

//     // Normalize coordinates
//     const normalizedLat = Number(selectedOption.value.lat.toFixed(6));
//     const normalizedLon = Number(selectedOption.value.lon.toFixed(6));
    
//     const normalizedLocation = {
//       lat: normalizedLat,
//       lon: normalizedLon
//     };

//     // Batch all state updates
//     setSelectedValue({
//       ...selectedOption,
//       value: { ...selectedOption.value, ...normalizedLocation }
//     });
//     setInputValue(selectedOption.label);
    
//     // Store in localStorage with multiple fallbacks
//     try {
//       // Store the full selection data
//       const storageValue = JSON.stringify({
//         ...selectedOption,
//         value: { ...selectedOption.value, ...normalizedLocation }
//       });
//       localStorage.setItem('selectedLocation', storageValue);
//       localStorage.setItem('dropdownInputValue', selectedOption.label);
      
//       // Store coordinates separately for redundancy
//       localStorage.setItem('savedLat', normalizedLat.toString());
//       localStorage.setItem('savedLon', normalizedLon.toString());
      
//       // Store timestamp of last update
//       localStorage.setItem('lastLocationUpdate', now.toString());
//     } catch (error) {
//       console.error('Error saving location to localStorage:', error);
//     }
    
//     // Set location context
//     setLocation(normalizedLocation);
    
//     // Signal location change
//     onLocationChangeRef.current(normalizedLocation);
//     setIsLocationChanging(true);
    
//     // Reset location changing state after a delay
//     setTimeout(() => {
//       setIsLocationChanging(false);
//     }, 1000);
//   }
// };

//   useEffect(() => {
//     if (selectedValue) {
//       setInputValue(selectedValue.label);
//     }
//   }, [selectedValue]);

  
//   const handleKeyDown = (event: React.KeyboardEvent) => {
//     if (event.key === 'Enter' && addressSuggestions.length > 0) {
//       const firstSuggestion = addressSuggestions[0];
//       setSelectedValue(firstSuggestion);
//       setInputValue(firstSuggestion.label);
      
//       // Update both context and callback
//       setLocation({
//         lat: firstSuggestion.value.lat,
//         lon: firstSuggestion.value.lon
//       });
      
//       onLocationChangeRef.current({
//         lat: firstSuggestion.value.lat,
//         lon: firstSuggestion.value.lon
//       });
//     }
//   };

//   const allOptions = [
//     ...locationOptions.filter(opt => !opt.isAddressSearch),
//     ...(addressSuggestions.length > 0
//       ? [{ label: 'Custom Addresses', options: addressSuggestions }]
//       : [])
//   ];

//   const customStyles = {
//     control: (provided: any) => ({
//       ...provided,
//       width: '300px',
//       borderRadius: '8px',
//       border: '1px solid #ccc',
//       boxShadow: 'none',
//       '&:hover': { border: '1px solid #2684FF' }
//     }),
//     menuPortal: (base: any) => ({
//       ...base,
//       zIndex: 9999,
//     }),
//     singleValue: (provided: any) => ({
//       ...provided,
//       maxWidth: '100%',
//       whiteSpace: 'nowrap',
//       overflow: 'hidden',
//       textOverflow: 'ellipsis'
//     }),
//     menu: (provided: any) => ({
//       ...provided,
//       borderRadius: '8px',
//       boxShadow: '0 4px 11px rgba(0, 0, 0, 0.1)'
//     }),
//     option: (provided: any, { isSelected, isFocused, data }: any) => {
//       const isSameAsCurrent = selectedValue?.value?.lat === data.value.lat &&
//                               selectedValue?.value?.lon === data.value.lon;
    
//       const isClosestStop = data.label.includes('Closest stop to you');
//       const isEstimatedBusLocation = data.label.includes('Our estimated bus location');
//       const isMTAProvided = data.label.includes('MTA provided bus location');
    
//       let backgroundColor = 'white';
//       let color = 'black';
//       let fontWeight = 'normal';
    
//       if (isClosestStop && (isEstimatedBusLocation || isMTAProvided)) {
//         backgroundColor = '#2684FF';
//         color = 'white';
//         fontWeight = 'bold';
//       } else if (isEstimatedBusLocation && isMTAProvided) {
//         backgroundColor = '#FFD700';
//         color = 'black';
//         fontWeight = 'bold';
//       } else if (isClosestStop) {
//         backgroundColor = '#2684FF';
//         color = 'white';
//         fontWeight = 'bold';
//       } else if (isEstimatedBusLocation) {
//         backgroundColor = '#FFD700';
//         color = 'black';
//         fontWeight = 'bold';
//       } else if (isMTAProvided) {
//         backgroundColor = '#FFFF00';
//         color = 'black';
//         fontWeight = 'bold';
//       } else if (isSameAsCurrent) {
//         backgroundColor = '#2684FF';
//         color = 'white';
//         fontWeight = 'bold';
//       } else if (isSelected) {
//         backgroundColor = '#2684FF';
//         color = 'white';
//       } else if (isFocused) {
//         backgroundColor = '#f0f0f0';
//       }
    
//       return {
//         ...provided,
//         backgroundColor,
//         color,
//         fontWeight
//       };
//     }
//   };  

//   const handleFocus = () => {
//     if (isTouchDevice()) {
//       handleInputChange("", { action: "clear" });
//     }
//     setMenuIsOpen(true); // Always open the menu on focus
//   };

//   return (
//     <Select
//       components={{ ClearIndicator }}
//       options={allOptions}
//       styles={customStyles}
//       inputValue={inputValue}
//       onChange={handleSelectChange}
//       onInputChange={handleInputChange}
//       onKeyDown={handleKeyDown}
//       isLoading={isLoading}
//       onFocus={handleFocus}
//       value={selectedValue}
//       isClearable
//       placeholder="Search location or address..."
//       noOptionsMessage={() => null} // This will always show options
//       filterOption={(option: any, input: string) => {
//         // Check if it's a group of options
//         if (option.options) {
//           return input && input.length > 3; // Only show custom addresses group when typing
//         }
        
//         // For individual options
//         if (!input || input.length <= 3) {
//           return !option.data?.isCustomAddress; // Only show preset locations
//         }
//         return option.label.toLowerCase().includes(input.toLowerCase());
//       }}
//       className="location-dropdown"
//       classNamePrefix="location-select"
//       menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
//       menuPosition="fixed"
//       menuIsOpen={menuIsOpen} // Dynamically control menu visibility
//     onMenuClose={() => setMenuIsOpen(false)} // Update state on close
//     onMenuOpen={() => setMenuIsOpen(true)}  // Update state on open
//     />
//   );
// };

// export default React.memo(LocationDropdown);

import React, { useState, useEffect, useRef } from 'react';
import Select, { ClearIndicatorProps, GroupBase } from 'react-select'; // Add these imports
import { useLocation } from './locationContext';

interface LocationSelectOption {
  value: {
    lat: number;
    lon: number;
    label: string;
  };
  label: string;
  isCustomAddress: boolean;
}

interface LocationDropdownProps {
  onLocationChange: (newLocation: { lat: number | null; lon: number | null }) => void;
  isLocationChanging: boolean;
  setIsLocationChanging: (value: boolean) => void;
  isUsingGeolocation?: boolean;  // New prop to indicate if using geolocation
  currentAddress?: string;       // New prop for current address when using geolocation
}

const LocationDropdown: React.FC<LocationDropdownProps> = ({
  onLocationChange,
  isLocationChanging,
  setIsLocationChanging,
  isUsingGeolocation = false,
  currentAddress
}) => {
  const [inputValue, setInputValue] = useState('');
  const [selectedValue, setSelectedValue] = useState<LocationSelectOption | null>(null);
  const [addressSuggestions, setAddressSuggestions] = useState<Array<LocationSelectOption>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const lastUpdateRef = useRef<number>(0);
  const THROTTLE_MS = 1000;
  const { setLocation } = useLocation();
  const onLocationChangeRef = useRef(onLocationChange);
  const [animatedPlaceholder, setAnimatedPlaceholder] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const placeholderTexts = [
    "30 Rockefeller Plaza...",
    "Empire State Building...",
    "One World Trade Center...",
    "Search for an address..."
  ];
  const ClearIndicatorComponent: React.ComponentType<ClearIndicatorProps<LocationSelectOption, false, GroupBase<LocationSelectOption>>> = (props) => (
    <div
        {...props.innerProps}
        style={{
            cursor: "pointer",
            padding: "0 8px",
            fontSize: "1.2rem",
            color: "#888",
        }}
        title="Clear"
        onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleInputChange("", { action: "clear" }); // Trigger the clear action
        }}
    >
        ×
    </div>
);
  useEffect(() => {
    if (isUsingGeolocation || selectedValue) {
      setIsTyping(false);
      return;
    }

      if (!isTyping) return;
  
      let typingTimer: NodeJS.Timeout;
      if (isTyping) {
          typingTimer = setTimeout(() => {
              if (isDeleting) {
                  if (currentCharIndex > 0) {
                      setAnimatedPlaceholder(placeholderTexts[currentTextIndex].slice(0, currentCharIndex - 1));
                      setCurrentCharIndex((prev) => prev - 1);
                  } else {
                      setIsDeleting(false);
                      setCurrentTextIndex((prev) => (prev + 1) % placeholderTexts.length);
                  }
              } else {
                  if (currentCharIndex < placeholderTexts[currentTextIndex].length) {
                      setAnimatedPlaceholder(placeholderTexts[currentTextIndex].slice(0, currentCharIndex + 1));
                      setCurrentCharIndex((prev) => prev + 1);
                  } else {
                      setTimeout(() => {
                          setIsDeleting(true);
                      }, 1000);
                  }
              }
          }, isDeleting ? 50 : 100);
      }
  
      return () => clearTimeout(typingTimer);
  }, [isTyping, currentCharIndex, currentTextIndex, isDeleting, placeholderTexts, isUsingGeolocation, selectedValue]);

  // Set initial value based on geolocation status
  useEffect(() => {
    if (isUsingGeolocation && currentAddress) {
      setInputValue("Your current location");
      setSelectedValue({
        value: {
          lat: 0, // These will be set by the geolocation
          lon: 0,
          label: "Your current location"
        },
        label: "Your current location",
        isCustomAddress: false
      });
    }
  }, [isUsingGeolocation, currentAddress]);
  
  // Add cleanup listener for page unload
  useEffect(() => {
    const handleUnload = () => {
      localStorage.removeItem('selectedLocation');
      localStorage.removeItem('savedLat');
      localStorage.removeItem('savedLon');
      localStorage.removeItem('dropdownInputValue');
      localStorage.removeItem('lastLocationUpdate');
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  useEffect(() => {
  const savedLocation = localStorage.getItem('selectedLocation');
  if (savedLocation) {
    try {
      const parsed = JSON.parse(savedLocation);
      setSelectedValue(parsed);
      setInputValue(parsed.label);
    } catch (e) {
      console.error('Error parsing saved location:', e);
    }
  }
}, []);

  useEffect(() => {
    onLocationChangeRef.current = onLocationChange;
  }, [onLocationChange]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (inputValue.length > 3 && inputValue !== "Your current location") {
        setIsLoading(true);
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?` +
            new URLSearchParams({
              q: inputValue + ' New York City',
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
        } catch (error) {
          console.error('Error fetching suggestions:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setAddressSuggestions([]);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [inputValue]);

  const handleInputChange = (newVal: string, { action }: { action: string }) => {
    if (action === "input-change") {
        setInputValue(newVal);
        setMenuIsOpen(true); // Open the dropdown when input changes
    } else if (action === "clear") {
        setInputValue(""); // Clear the input value
        setSelectedValue(null); // Clear the selected value
        setMenuIsOpen(false); // Close the menu
        onLocationChange({ lat: null, lon: null }); // Notify the parent component
        localStorage.removeItem('selectedLocation'); // Clear saved location if applicable

        setIsTyping(false); // Stop typing animation
        setTimeout(() => {
            setIsTyping(true); // Restart typing animation after a short delay
        }, 100); // Add a slight delay to ensure a visual reset
    }
};

  const handleSelectChange = async (selectedOption: LocationSelectOption | null) => {
  if (selectedOption) {
    const now = Date.now();
    if (now - lastUpdateRef.current < THROTTLE_MS) {
      return;
    }
    lastUpdateRef.current = now;

    const normalizedLat = Number(selectedOption.value.lat.toFixed(6));
    const normalizedLon = Number(selectedOption.value.lon.toFixed(6));
    
    // Create a properly formatted option object
    const formattedOption = {
      value: {
        lat: normalizedLat,
        lon: normalizedLon,
        label: selectedOption.label
      },
      label: selectedOption.label,
      isCustomAddress: selectedOption.isCustomAddress
    };
    
    setSelectedValue(formattedOption);  // Use the formatted option
    setInputValue(selectedOption.label);
    setLocation({ lat: normalizedLat, lon: normalizedLon });
    onLocationChangeRef.current({ lat: normalizedLat, lon: normalizedLon });
    setIsLocationChanging(true);
    
    // Store the selection in localStorage
    localStorage.setItem('selectedLocation', JSON.stringify(formattedOption));
    
    setTimeout(() => {
      setIsLocationChanging(false);
    }, 1000);
  } else {
    // Handle clearing the selection
    setInputValue(""); // Clear the input value
    setSelectedValue(null); // Clear the selected value
    onLocationChange({ lat: null, lon: null }); // Notify the parent component
    localStorage.removeItem('selectedLocation'); // Clear saved location
  }
};

  const customStyles = {
    control: (provided: any) => ({
      ...provided,
      width: '300px',
      borderRadius: '8px',
      border: '1px solid #ccc',
      boxShadow: 'none',
      '&:hover': { border: '1px solid #2684FF' },
      backgroundColor: isUsingGeolocation ? '#f0f0f0' : 'white'
    }),
    menuPortal: (base: any) => ({
      ...base,
      zIndex: 9999,
    }),
    menu: (provided: any) => ({
      ...provided,
      borderRadius: '8px',
      boxShadow: '0 4px 11px rgba(0, 0, 0, 0.1)'
    }),
    indicatorSeparator: () => ({
      display: 'none'
    }),
    input: (provided: any) => ({
      ...provided,
      color: isUsingGeolocation ? '#666' : 'inherit'
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: '#757575',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    })
  };

  return (
    <Select
      components={{
        DropdownIndicator: () => null,
        ClearIndicator: isUsingGeolocation ? undefined : ClearIndicatorComponent}
      }
      options={addressSuggestions}
      styles={customStyles}
      inputValue={inputValue}
      onChange={handleSelectChange}
      onInputChange={handleInputChange}
      isLoading={isLoading}
      value={selectedValue}
      isClearable={!isUsingGeolocation}
      isDisabled={isUsingGeolocation}
      placeholder={isUsingGeolocation ? "Your current location" : 
        selectedValue ? selectedValue.label : 
        animatedPlaceholder}
      noOptionsMessage={() => inputValue.length <= 3 ? "Type to search for an address" : "No results found"}
      menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
      menuIsOpen={menuIsOpen && !isUsingGeolocation}
      onMenuClose={() => setMenuIsOpen(false)}
      onMenuOpen={() => !isUsingGeolocation && setMenuIsOpen(true)}
      className="location-dropdown"
      classNamePrefix="location-select"
    />
  );
};

export default React.memo(LocationDropdown);