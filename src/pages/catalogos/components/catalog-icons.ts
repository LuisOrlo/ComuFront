import {
  Camera01Icon, CameraVideoIcon, Radio01Icon, PodcastIcon,
  Mic01Icon, Megaphone01Icon, News01Icon, ContentWritingIcon,
  QuillWrite01Icon, PenTool03Icon, WebDesign01Icon, Film01Icon,
  Video01Icon, MusicNote01Icon, HeadphonesIcon, VoiceIcon,
  PresentationOnlineIcon, SpeechIcon, GlobalIcon, LiveStreaming01Icon,
  AdobeAfterEffectIcon, AdobePremierIcon, BrowserIcon, InstagramIcon,
  Pen01Icon,
} from "@hugeicons/core-free-icons"
import type { IconSvgElement } from "@hugeicons/react"

export interface CatalogIconOption {
  name: string
  label: string
  category: string
  icon: IconSvgElement
}

export const CATALOG_ICONS: CatalogIconOption[] = [
  { name: "Camera01Icon",           label: "Fotografía",           category: "Producción Audiovisual", icon: Camera01Icon },
  { name: "CameraVideoIcon",        label: "Videografía",          category: "Producción Audiovisual", icon: CameraVideoIcon },
  { name: "Film01Icon",             label: "Cine",                 category: "Producción Audiovisual", icon: Film01Icon },
  { name: "Video01Icon",            label: "Video",                category: "Producción Audiovisual", icon: Video01Icon },
  { name: "MusicNote01Icon",        label: "Producción Musical",   category: "Producción Audiovisual", icon: MusicNote01Icon },
  { name: "HeadphonesIcon",         label: "Audio",                category: "Producción Audiovisual", icon: HeadphonesIcon },
  { name: "Radio01Icon",            label: "Radio",                category: "Medios",                 icon: Radio01Icon },
  { name: "PodcastIcon",            label: "Podcast",              category: "Medios",                 icon: PodcastIcon },
  { name: "Mic01Icon",              label: "Locución",             category: "Medios",                 icon: Mic01Icon },
  { name: "LiveStreaming01Icon",    label: "Streaming",            category: "Medios",                 icon: LiveStreaming01Icon },
  { name: "News01Icon",             label: "Periodismo",           category: "Comunicación",           icon: News01Icon },
  { name: "ContentWritingIcon",     label: "Redacción",            category: "Comunicación",           icon: ContentWritingIcon },
  { name: "QuillWrite01Icon",       label: "Escritura Creativa",   category: "Comunicación",           icon: QuillWrite01Icon },
  { name: "Megaphone01Icon",        label: "Publicidad",           category: "Marketing",              icon: Megaphone01Icon },
  { name: "PresentationOnlineIcon", label: "Marketing Digital",    category: "Marketing",              icon: PresentationOnlineIcon },
  { name: "GlobalIcon",             label: "Comunicación Global",  category: "Marketing",              icon: GlobalIcon },
  { name: "InstagramIcon",          label: "Redes Sociales",       category: "Marketing",              icon: InstagramIcon },
  { name: "SpeechIcon",             label: "Oratoria",             category: "Habilidades",            icon: SpeechIcon },
  { name: "VoiceIcon",              label: "Doblaje",              category: "Habilidades",            icon: VoiceIcon },
  { name: "PenTool03Icon",          label: "Diseño Gráfico",       category: "Diseño",                 icon: PenTool03Icon },
  { name: "WebDesign01Icon",        label: "Diseño Web",           category: "Diseño",                 icon: WebDesign01Icon },
  { name: "AdobePremierIcon",       label: "Edición de Video",     category: "Postproducción",         icon: AdobePremierIcon },
  { name: "AdobeAfterEffectIcon",   label: "Postproducción",       category: "Postproducción",         icon: AdobeAfterEffectIcon },
  { name: "Pen01Icon",              label: "Guion",                category: "Postproducción",         icon: Pen01Icon },
  { name: "BrowserIcon",            label: "Medios Digitales",     category: "Postproducción",         icon: BrowserIcon },
]

export const iconMap: Record<string, IconSvgElement> = {}
for (const item of CATALOG_ICONS) {
  iconMap[item.name] = item.icon
}
