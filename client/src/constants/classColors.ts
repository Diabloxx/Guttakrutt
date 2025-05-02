export interface ClassColor {
  name: string;
  color: string;
  hexColor: string;
  textColor: string;
  bgColor: string;
}

const classColors: Record<string, ClassColor> = {
  "Warrior": {
    name: "Warrior",
    color: "warrior",
    hexColor: "#C79C6E",
    textColor: "text-warrior",
    bgColor: "bg-warrior"
  },
  "Paladin": {
    name: "Paladin",
    color: "paladin",
    hexColor: "#F58CBA",
    textColor: "text-paladin",
    bgColor: "bg-paladin"
  },
  "Hunter": {
    name: "Hunter",
    color: "hunter",
    hexColor: "#ABD473",
    textColor: "text-hunter",
    bgColor: "bg-hunter"
  },
  "Rogue": {
    name: "Rogue",
    color: "rogue",
    hexColor: "#FFF569",
    textColor: "text-rogue",
    bgColor: "bg-rogue"
  },
  "Priest": {
    name: "Priest",
    color: "priest",
    hexColor: "#FFFFFF",
    textColor: "text-priest",
    bgColor: "bg-priest"
  },
  "Death Knight": {
    name: "Death Knight",
    color: "death-knight",
    hexColor: "#C41F3B",
    textColor: "text-death-knight",
    bgColor: "bg-death-knight"
  },
  "Shaman": {
    name: "Shaman",
    color: "shaman",
    hexColor: "#0070DE",
    textColor: "text-shaman",
    bgColor: "bg-shaman"
  },
  "Mage": {
    name: "Mage",
    color: "mage",
    hexColor: "#69CCF0",
    textColor: "text-mage",
    bgColor: "bg-mage"
  },
  "Warlock": {
    name: "Warlock",
    color: "warlock",
    hexColor: "#9482C9",
    textColor: "text-warlock",
    bgColor: "bg-warlock"
  },
  "Monk": {
    name: "Monk",
    color: "monk",
    hexColor: "#00FF96",
    textColor: "text-monk",
    bgColor: "bg-monk"
  },
  "Druid": {
    name: "Druid",
    color: "druid",
    hexColor: "#FF7D0A",
    textColor: "text-druid",
    bgColor: "bg-druid"
  },
  "Demon Hunter": {
    name: "Demon Hunter",
    color: "demon-hunter",
    hexColor: "#A330C9",
    textColor: "text-demon-hunter",
    bgColor: "bg-demon-hunter"
  },
  "Evoker": {
    name: "Evoker",
    color: "evoker",
    hexColor: "#33937F",
    textColor: "text-evoker",
    bgColor: "bg-evoker"
  }
};

export function getClassColor(className: string): ClassColor {
  const classColor = classColors[className];
  return classColor || {
    name: "Unknown",
    color: "gray",
    hexColor: "#808080",
    textColor: "text-gray-400",
    bgColor: "bg-gray-400"
  };
}

export function getClassIconUrl(className: string): string {
  // Normalized class name for image lookup
  const normalizedName = className.toLowerCase().replace(/\s+/g, "");
  return `https://wow.zamimg.com/images/wow/icons/large/classicon_${normalizedName}.jpg`;
}

export default classColors;
