/**
 * Device detection utilities for responsive behavior
 */

export const isMobileDevice = (): boolean => {
    // Detectar por User Agent
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

    // Detectar móviles comunes
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

    return mobileRegex.test(userAgent);
};

export const isDesktopDevice = (): boolean => {
    return !isMobileDevice();
};
