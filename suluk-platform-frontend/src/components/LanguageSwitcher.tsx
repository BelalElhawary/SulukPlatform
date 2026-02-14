import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export function LanguageSwitcher() {
    const { i18n } = useTranslation();

    const toggleLanguage = () => {
        const newLang = i18n.language === 'en' ? 'ar' : 'en';
        i18n.changeLanguage(newLang);
    };

    useEffect(() => {
        document.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = i18n.language;
    }, [i18n.language]);

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={toggleLanguage}
            className="w-16 font-semibold"
        >
            {i18n.language === 'en' ? 'AR' : 'EN'}
        </Button>
    );
}
