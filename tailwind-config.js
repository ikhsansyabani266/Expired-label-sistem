/**
 * Tailwind CSS Configuration
 * Auto Expired Label System (AELS)
 */
tailwind.config = {
    theme: {
        extend: {
            colors: {
                coffee: {
                    50: '#F2F9F5',   // Very soft minty white background
                    100: '#D1EFE0',  // Soft mint cream
                    300: '#10B981',  // Mint Green - active elements
                    400: '#A18A81',  // Muted Warm Coffee Brown - text/muted icons
                    500: '#059669',  // Emerald Mint - primary brand/logo accent
                    600: '#047857',  // Dark Mint - primary hover states
                    700: '#5C4033',  // Classic Coffee Brown
                    800: '#2E221E',  // Dark Roast Coffee - sidebar hover
                    900: '#4E3629',  // Warm Espresso Brown - for brand text in sidebar
                    950: '#181210',  // Deepest Black Coffee / Espresso - sidebar background
                }
            }
        }
    }
};