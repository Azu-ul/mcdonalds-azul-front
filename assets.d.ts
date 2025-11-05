declare module '*.png' {
    import { ImageSourcePropType } from 'react-native';
    const value: ImageSourcePropType;
    export default value;
}

declare module '*.ico' {
    import { ImageSourcePropType } from 'react-native';
    const value: ImageSourcePropType;
    export default value;
}


declare module '*.jpeg' {
    const value: string;
    export default value;
}

declare module '*.gif' {
    const value: string;
    export default value;
}

declare module '*.webp' {
    const value: string;
    export default value;
}

declare module '*.ico' {
    const value: string;
    export default value;
}

declare module '*.svg' {
    import * as React from 'react';
    const content: React.FC<React.SVGProps<SVGSVGElement>>;
    export default content;
}
