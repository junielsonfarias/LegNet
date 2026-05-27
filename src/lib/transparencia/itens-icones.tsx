/**
 * Mapa de ICONE_NAME -> LucideIcon Component.
 * Importado por componentes 'use client' que renderizam itens do catalogo
 * de transparencia.
 */

import {
  Activity, Calendar, Users, UserCheck, CalendarDays,
  Briefcase, HelpCircle, Globe, Search, Scale,
  FileText, ScrollText, FileSignature, ClipboardList,
  Megaphone, Gavel,
  TrendingUp, CreditCard, Banknote, Receipt, Wallet,
  Clock, GraduationCap, UserPlus, FileCheck, FileBarChart,
  HardHat, Shield, Database, Handshake,
  Landmark, Building2, Truck,
  BarChart3, PieChart,
  MessageSquare, FileSearch, FileQuestion, BookOpen,
  Lock, CheckCircle2,
  type LucideIcon,
} from 'lucide-react'

import type { LucideIconName } from './itens-catalogo'

export const ICONES: Record<LucideIconName, LucideIcon> = {
  Activity, Calendar, Users, UserCheck, CalendarDays,
  Briefcase, HelpCircle, Globe, Search, Scale,
  FileText, ScrollText, FileSignature, ClipboardList,
  Megaphone, Gavel,
  TrendingUp, CreditCard, Banknote, Receipt, Wallet,
  Clock, GraduationCap, UserPlus, FileCheck, FileBarChart,
  HardHat, Shield, Database, Handshake,
  Landmark, Building2, Truck,
  BarChart3, PieChart,
  MessageSquare, FileSearch, FileQuestion, BookOpen,
  Lock, CheckCircle2,
}

export function getIcone(nome: LucideIconName): LucideIcon {
  return ICONES[nome] || FileText
}
