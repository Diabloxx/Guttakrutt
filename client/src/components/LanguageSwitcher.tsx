import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  // Determine the current language display name
  const currentLanguage = i18n.language === 'no' ? 'Norsk' : 'English';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-1 bg-transparent border-slate-700 hover:bg-slate-800 text-white">
          <Globe className="h-4 w-4" />
          <span>{currentLanguage}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700 text-white">
        <DropdownMenuItem 
          onClick={() => changeLanguage('en')}
          className={`cursor-pointer hover:bg-slate-800 ${i18n.language === 'en' ? 'bg-slate-800' : ''}`}
        >
          English
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => changeLanguage('no')}
          className={`cursor-pointer hover:bg-slate-800 ${i18n.language === 'no' ? 'bg-slate-800' : ''}`}
        >
          Norsk
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}