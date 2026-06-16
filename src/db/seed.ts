import 'reflect-metadata';
import * as bcrypt from 'bcryptjs';
import { AppDataSource } from '../lib/database';
import { Category } from '../entity/Category';
import { Subcategory } from '../entity/Subcategory';
import { Product } from '../entity/Product';
import { Client } from '../entity/Client';
import { User } from '../entity/User';
import { Movement } from '../entity/Movement';
import { UserRole } from '../entity/UserRole';
import { ClientType } from '../entity/ClientType';
import { MovementType } from '../entity/MovementType';
import { LocationType } from '../entity/LocationType';

function daysAgo(n: number, hour = 9): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d;
}

interface CategorySeed {
  name: string;
  allowsSerialNumber: boolean;
  requiresRefrigeration: boolean;
}

interface SubcategorySeed {
  name: string;
  categoryName: string;
}

interface ProductSeed {
  code: string;
  name: string;
  subcategoryName: string;
  weight: number;
  minStock: number;
  stock: number;
}

const CATEGORIES: CategorySeed[] = [
  { name: 'Camillas', allowsSerialNumber: false, requiresRefrigeration: false },
  { name: 'Agujas', allowsSerialNumber: false, requiresRefrigeration: false },
  { name: 'Terapias de Mano', allowsSerialNumber: false, requiresRefrigeration: false },
  { name: 'Suelo Pélvico', allowsSerialNumber: true, requiresRefrigeration: false },
  { name: 'Electroterapia', allowsSerialNumber: true, requiresRefrigeration: false },
  { name: 'Pelotas', allowsSerialNumber: false, requiresRefrigeration: false },
  { name: 'Bandas', allowsSerialNumber: false, requiresRefrigeration: false },
  { name: 'Masajeadores', allowsSerialNumber: true, requiresRefrigeration: false },
  { name: 'Cintas', allowsSerialNumber: false, requiresRefrigeration: false },
  { name: 'Pedales', allowsSerialNumber: true, requiresRefrigeration: false },
  { name: 'Accesorios', allowsSerialNumber: true, requiresRefrigeration: false },
];

const SUBCATEGORIES: SubcategorySeed[] = [
  { name: 'Camillas de Masaje', categoryName: 'Camillas' },
  { name: 'Camillas Quiroprácticas', categoryName: 'Camillas' },

  { name: 'Punción Seca Regular', categoryName: 'Agujas' },
  { name: 'Punción Seca Superficial', categoryName: 'Agujas' },
  { name: 'Punción Seca Premium', categoryName: 'Agujas' },
  { name: 'Agujas para Electroterapia', categoryName: 'Agujas' },

  { name: 'Entrenadores de Dedos', categoryName: 'Terapias de Mano' },
  { name: 'Ejercitadores Digiflex', categoryName: 'Terapias de Mano' },
  { name: 'Fortalecedores de Mano y Muñeca', categoryName: 'Terapias de Mano' },
  { name: 'Escaleras y Soportes para Dedos', categoryName: 'Terapias de Mano' },
  { name: 'Flexbars', categoryName: 'Terapias de Mano' },
  { name: 'Plastilina Terapéutica', categoryName: 'Terapias de Mano' },
  { name: 'Juegos Didácticos', categoryName: 'Terapias de Mano' },
  { name: 'Herramientas Manuales de Terapia', categoryName: 'Terapias de Mano' },

  { name: 'Ejercitadores de Piso Pélvico', categoryName: 'Suelo Pélvico' },
  { name: 'Biofeedback y Estimulación Pélvica', categoryName: 'Suelo Pélvico' },
  { name: 'Cables y Accesorios Pélvicos', categoryName: 'Suelo Pélvico' },

  { name: 'TENS y EMS', categoryName: 'Electroterapia' },
  { name: 'Ultrasonido', categoryName: 'Electroterapia' },
  { name: 'Magnetoterapia', categoryName: 'Electroterapia' },
  { name: 'Adaptadores', categoryName: 'Electroterapia' },
  { name: 'Cabezales y Cables', categoryName: 'Electroterapia' },
  { name: 'Electrodos y Geles', categoryName: 'Electroterapia' },
  { name: 'Termoterapia y Vapor', categoryName: 'Electroterapia' },

  { name: 'Pelotas de Gel', categoryName: 'Pelotas' },
  { name: 'Pelotas Fortalecedoras', categoryName: 'Pelotas' },
  { name: 'Balones y Balancines', categoryName: 'Pelotas' },

  { name: 'Bandas de Resistencia', categoryName: 'Bandas' },
  { name: 'Bandas para Dedos', categoryName: 'Bandas' },
  { name: 'Mallas de Resistencia', categoryName: 'Bandas' },
  { name: 'Sistemas de Suspensión y BFR', categoryName: 'Bandas' },

  { name: 'Masajeadores Eléctricos', categoryName: 'Masajeadores' },
  { name: 'Rodillos y Herramientas de Masaje Manual', categoryName: 'Masajeadores' },
  { name: 'Terapia de Frío', categoryName: 'Masajeadores' },

  { name: 'Cintas Deportivas', categoryName: 'Cintas' },

  { name: 'Pedales Ejercitadores', categoryName: 'Pedales' },
  { name: 'Patines de Estiramiento', categoryName: 'Pedales' },

  { name: 'Equipos de Medición', categoryName: 'Accesorios' },
  { name: 'Entrenamiento de Agilidad', categoryName: 'Accesorios' },
  { name: 'Termoterapia Personal', categoryName: 'Accesorios' },
  { name: 'Estiramiento y Movilidad', categoryName: 'Accesorios' },
  { name: 'Modelos Anatómicos', categoryName: 'Accesorios' },
  { name: 'Pesas y Fitness', categoryName: 'Accesorios' },
  { name: 'Instrumental Clínico', categoryName: 'Accesorios' },
];

const PRODUCTS: ProductSeed[] = [
  // Camillas
  { code: 'CM-01', name: 'Camilla Para Masaje WT231A Negra', subcategoryName: 'Camillas de Masaje', weight: 18, minStock: 1, stock: 4 },
  { code: 'CMQ-01', name: 'Camilla Quiropractica Portatil ARENA-180', subcategoryName: 'Camillas Quiroprácticas', weight: 22, minStock: 1, stock: 3 },

  // Agujas
  { code: 'AGJ-01', name: 'Aguja Puncion seca (APS) REGULAR 0.25x 25 con guia (100 unid) ROJO', subcategoryName: 'Punción Seca Regular', weight: 0.15, minStock: 20, stock: 45 },
  { code: 'AGJ-02', name: 'Aguja Puncion seca (APS) REGULAR 0.30x 40 con guia (100 unid) BLANCO', subcategoryName: 'Punción Seca Regular', weight: 0.18, minStock: 20, stock: 38 },
  { code: 'AGJ-03', name: 'Aguja Puncion seca (APS) REGULAR 0,30x 50 con guia (100 unid) ROSA', subcategoryName: 'Punción Seca Regular', weight: 0.2, minStock: 20, stock: 30 },
  { code: 'AGJ-04', name: 'Aguja Puncion seca (APS) REGULAR 0,30x 60 con guia (100 unid) LILA', subcategoryName: 'Punción Seca Regular', weight: 0.22, minStock: 15, stock: 25 },
  { code: 'AGJ-05', name: 'Aguja Puncion seca (APS) REGULAR 0,30x75 con guia (100 unid) NEGRO', subcategoryName: 'Punción Seca Regular', weight: 0.25, minStock: 15, stock: 18 },
  { code: 'AGJ-06', name: 'Aguja Puncion seca (APS) REGULAR 0,25x 40 con guia (100 unid) AMARILLO', subcategoryName: 'Punción Seca Regular', weight: 0.18, minStock: 20, stock: 33 },
  { code: 'AGJ-08', name: 'Aguja Puncion seca (APS) REGULAR 0.30x 30 con guía (100 unid) NARANJA', subcategoryName: 'Punción Seca Regular', weight: 0.16, minStock: 15, stock: 22 },
  { code: 'AGJ-09', name: 'Aguja Puncion Seca (APS) 0,18x25 con tubo (100 unid) Superficial ROJO-BLANCO', subcategoryName: 'Punción Seca Superficial', weight: 0.14, minStock: 10, stock: 12 },
  { code: 'AGJ-11', name: 'Aguja AGP PREMIUM (mango plata envase papel individual) 0,16x25 (200 Unid.)', subcategoryName: 'Punción Seca Premium', weight: 0.3, minStock: 10, stock: 14 },
  { code: 'AGJ-13', name: 'Aguja Electroterapia 0,30x30 mm (caja 200 unidades)', subcategoryName: 'Agujas para Electroterapia', weight: 0.32, minStock: 10, stock: 8 },

  // Terapias de Mano — Entrenadores de Dedos
  { code: 'ED-02', name: 'Entrenador de Dedos Sencillo - Mano Robot Talla M Derecha', subcategoryName: 'Entrenadores de Dedos', weight: 0.6, minStock: 3, stock: 5 },
  { code: 'ED-03', name: 'Entrenador de Dedos Sencillo - Mano Robot Talla M Izquierda', subcategoryName: 'Entrenadores de Dedos', weight: 0.6, minStock: 3, stock: 4 },
  { code: 'ED-04', name: 'Entrenador de Dedos Sencillo - Mano Robot Talla L Derecha', subcategoryName: 'Entrenadores de Dedos', weight: 0.65, minStock: 3, stock: 2 },
  { code: 'ED-05', name: 'Entrenador de Dedos Sencillo - Mano Robot Talla L Izquierda', subcategoryName: 'Entrenadores de Dedos', weight: 0.65, minStock: 3, stock: 3 },

  // Terapias de Mano — Ejercitadores Digiflex
  { code: 'DGC-01', name: 'Digiflex Cando Amarillo', subcategoryName: 'Ejercitadores Digiflex', weight: 0.1, minStock: 8, stock: 15 },
  { code: 'DGC-02', name: 'Digiflex Cando Azul', subcategoryName: 'Ejercitadores Digiflex', weight: 0.1, minStock: 8, stock: 14 },
  { code: 'DGC-03', name: 'Digiflex Cando Rojo', subcategoryName: 'Ejercitadores Digiflex', weight: 0.1, minStock: 8, stock: 10 },
  { code: 'DGC-04', name: 'Digiflex Cando Verde', subcategoryName: 'Ejercitadores Digiflex', weight: 0.1, minStock: 8, stock: 9 },
  { code: 'DGC-05', name: 'Digiflex Cando Negro', subcategoryName: 'Ejercitadores Digiflex', weight: 0.1, minStock: 8, stock: 6 },
  { code: 'DGL-01', name: 'Digiflex Lite Amarillo', subcategoryName: 'Ejercitadores Digiflex', weight: 0.08, minStock: 8, stock: 16 },
  { code: 'DGL-02', name: 'Digiflex Lite Azul', subcategoryName: 'Ejercitadores Digiflex', weight: 0.08, minStock: 8, stock: 13 },
  { code: 'DGL-03', name: 'Digiflex Lite Rojo', subcategoryName: 'Ejercitadores Digiflex', weight: 0.08, minStock: 8, stock: 11 },
  { code: 'DGL-04', name: 'Digiflex Lite Verde', subcategoryName: 'Ejercitadores Digiflex', weight: 0.08, minStock: 8, stock: 9 },
  { code: 'DGL-05', name: 'Digiflex Lite Negro', subcategoryName: 'Ejercitadores Digiflex', weight: 0.08, minStock: 8, stock: 7 },

  // Terapias de Mano — Fortalecedores de Mano y Muñeca
  { code: 'EC-01', name: 'Fortalecedor de Mano y Muñeca Sencillo - Hand Grip', subcategoryName: 'Fortalecedores de Mano y Muñeca', weight: 0.2, minStock: 10, stock: 20 },
  { code: 'EDAA-01', name: 'Entrenador de Agarre Ajustable Negro-Naranja', subcategoryName: 'Fortalecedores de Mano y Muñeca', weight: 0.35, minStock: 6, stock: 12 },
  { code: 'EDM-01', name: 'Ejercitador De Mano En Malla Rosado 20Lb', subcategoryName: 'Fortalecedores de Mano y Muñeca', weight: 0.15, minStock: 8, stock: 14 },
  { code: 'EDM-02', name: 'Ejercitador De Mano En Malla Azul 40Lb', subcategoryName: 'Fortalecedores de Mano y Muñeca', weight: 0.15, minStock: 8, stock: 12 },
  { code: 'EDM-03', name: 'Ejercitador De Mano En Malla Gris 60Lb', subcategoryName: 'Fortalecedores de Mano y Muñeca', weight: 0.15, minStock: 8, stock: 9 },
  { code: 'EDS-01', name: 'Set Ejercitador de Dedos en Silicona x 3', subcategoryName: 'Fortalecedores de Mano y Muñeca', weight: 0.2, minStock: 8, stock: 16 },
  { code: 'FA-01', name: 'Dona Fortalecedor De Mano 7cm Amarilla 20Lbs', subcategoryName: 'Fortalecedores de Mano y Muñeca', weight: 0.12, minStock: 10, stock: 18 },
  { code: 'FA-02', name: 'Dona Fortalecedor De Mano 7cm Verde 30Lbs', subcategoryName: 'Fortalecedores de Mano y Muñeca', weight: 0.12, minStock: 10, stock: 15 },
  { code: 'FA-03', name: 'Dona Fortalecedor De Mano 7cm Azul 40Lbs', subcategoryName: 'Fortalecedores de Mano y Muñeca', weight: 0.12, minStock: 10, stock: 11 },
  { code: 'FA-04', name: 'Dona Fortalecedor De Mano 7cm Naranja 50Lbs', subcategoryName: 'Fortalecedores de Mano y Muñeca', weight: 0.12, minStock: 10, stock: 8 },
  { code: 'FA-05', name: 'Dona Fortalecedor De Mano 7cm Negro 60Lbs', subcategoryName: 'Fortalecedores de Mano y Muñeca', weight: 0.12, minStock: 10, stock: 7 },

  // Terapias de Mano — Escaleras y Soportes para Dedos
  { code: 'EDD-01', name: 'Escalerilla De Dedos', subcategoryName: 'Escaleras y Soportes para Dedos', weight: 0.3, minStock: 5, stock: 9 },
  { code: 'EDH-01', name: 'Escalera De Hombro', subcategoryName: 'Escaleras y Soportes para Dedos', weight: 0.9, minStock: 4, stock: 6 },
  { code: 'SEM-01', name: 'Soporte De Entrenamiento Para Dedos Amarilla Con Sujetador', subcategoryName: 'Escaleras y Soportes para Dedos', weight: 0.25, minStock: 6, stock: 10 },
  { code: 'SEM-02', name: 'Soporte De Entrenamiento Para Dedos Blanca Con Sujetador', subcategoryName: 'Escaleras y Soportes para Dedos', weight: 0.25, minStock: 6, stock: 8 },

  // Terapias de Mano — Flexbars (FL-06 y FL-07 reemplazan los dos ítems "(S/C)" de la lista original, sin código)
  { code: 'FL-01', name: 'Flexbar Amarillo-Cando', subcategoryName: 'Flexbars', weight: 0.18, minStock: 10, stock: 16 },
  { code: 'FL-03', name: 'Flexbar Rojo ICMTHERAPY', subcategoryName: 'Flexbars', weight: 0.2, minStock: 10, stock: 14 },
  { code: 'FL-04', name: 'Flexbar Verde ICMTHERAPY', subcategoryName: 'Flexbars', weight: 0.2, minStock: 10, stock: 12 },
  { code: 'FL-05', name: 'Flexbar Azul-Cando', subcategoryName: 'Flexbars', weight: 0.22, minStock: 10, stock: 9 },
  { code: 'FL-06', name: 'Flexbar Amarillo- ICMTHERAPY', subcategoryName: 'Flexbars', weight: 0.18, minStock: 10, stock: 13 },
  { code: 'FL-07', name: 'Flexbar Azul- ICMTHERAPY', subcategoryName: 'Flexbars', weight: 0.22, minStock: 10, stock: 11 },

  // Terapias de Mano — Plastilina Terapéutica
  { code: 'PB-04', name: 'Plastilina Cando x 4.5 lbrs Verde', subcategoryName: 'Plastilina Terapéutica', weight: 2.0, minStock: 6, stock: 10 },
  { code: 'PB-06', name: 'Plastilina Cando x 4.5 lbrs Negra', subcategoryName: 'Plastilina Terapéutica', weight: 2.0, minStock: 6, stock: 9 },
  { code: 'PB-07', name: 'Plastilina ICMTHERAPY x 5 libras Amarilla', subcategoryName: 'Plastilina Terapéutica', weight: 2.3, minStock: 6, stock: 12 },
  { code: 'PB-08', name: 'Plastilina ICMTHERAPY x 5 libras Roja', subcategoryName: 'Plastilina Terapéutica', weight: 2.3, minStock: 6, stock: 10 },
  { code: 'PB-09', name: 'Plastilina ICMTHERAPY x 5 libras Verde', subcategoryName: 'Plastilina Terapéutica', weight: 2.3, minStock: 6, stock: 8 },
  { code: 'PB-10', name: 'Plastilina Icm Therapy x 5 libras Azul', subcategoryName: 'Plastilina Terapéutica', weight: 2.3, minStock: 6, stock: 7 },
  { code: 'PB-11', name: 'Plastilina Icm Therapy x 5 libras Negra', subcategoryName: 'Plastilina Terapéutica', weight: 2.3, minStock: 6, stock: 6 },
  { code: 'PL-06', name: 'Plastilina Cando x libra Negra', subcategoryName: 'Plastilina Terapéutica', weight: 0.45, minStock: 12, stock: 20 },
  { code: 'PL-07', name: 'Plastilina Icm Therapy x libra Amarilla', subcategoryName: 'Plastilina Terapéutica', weight: 0.45, minStock: 12, stock: 18 },
  { code: 'PL-08', name: 'Plastilina Icm Therapy x libra Roja', subcategoryName: 'Plastilina Terapéutica', weight: 0.45, minStock: 12, stock: 16 },
  { code: 'PL-09', name: 'Plastilina Icm Therapy x libra Azul', subcategoryName: 'Plastilina Terapéutica', weight: 0.45, minStock: 12, stock: 14 },
  { code: 'PL-10', name: 'Plastilina Icm Therapy x libra Verde', subcategoryName: 'Plastilina Terapéutica', weight: 0.45, minStock: 12, stock: 11 },
  { code: 'PL-11', name: 'Plastilina Icm Therapy x libra Negra', subcategoryName: 'Plastilina Terapéutica', weight: 0.45, minStock: 12, stock: 10 },
  { code: 'PO-04', name: 'Plastilina Cando x 2 oz Verde', subcategoryName: 'Plastilina Terapéutica', weight: 0.06, minStock: 15, stock: 25 },
  { code: 'PO-06', name: 'Plastilina Cando x 2 oz Negra', subcategoryName: 'Plastilina Terapéutica', weight: 0.06, minStock: 15, stock: 22 },
  { code: 'PO-07', name: 'Plastilina Icm Therapy x 2 oz Amarilla', subcategoryName: 'Plastilina Terapéutica', weight: 0.06, minStock: 15, stock: 20 },
  { code: 'PO-08', name: 'Plastilina Icm Therapy x 2 oz Roja', subcategoryName: 'Plastilina Terapéutica', weight: 0.06, minStock: 15, stock: 18 },
  { code: 'PO-09', name: 'Plastilina Icm Therapy x 2 oz Verde', subcategoryName: 'Plastilina Terapéutica', weight: 0.06, minStock: 15, stock: 16 },
  { code: 'PO-10', name: 'Plastilina Icm Therapy x 2 oz Negra', subcategoryName: 'Plastilina Terapéutica', weight: 0.06, minStock: 15, stock: 13 },
  { code: 'PO-11', name: 'Plastilina Icm Therapy x 2 oz Azul', subcategoryName: 'Plastilina Terapéutica', weight: 0.06, minStock: 15, stock: 12 },

  // Terapias de Mano — Juegos Didácticos
  { code: 'JD-01', name: 'Juego Didactico de tablas de Aprendizaje de Vestir', subcategoryName: 'Juegos Didácticos', weight: 0.8, minStock: 4, stock: 7 },
  { code: 'JD-02', name: 'Juego Didactico de Enhebrado con Cordones', subcategoryName: 'Juegos Didácticos', weight: 0.5, minStock: 4, stock: 6 },
  { code: 'JD-03', name: 'Juego Didactico de Tablero de Clavijas', subcategoryName: 'Juegos Didácticos', weight: 0.6, minStock: 4, stock: 5 },
  { code: 'JD-04', name: 'Juego Didactico Conteo de Animales', subcategoryName: 'Juegos Didácticos', weight: 0.4, minStock: 4, stock: 8 },
  { code: 'JD-05', name: 'Juego Didactico de Aros Magneticos', subcategoryName: 'Juegos Didácticos', weight: 0.45, minStock: 4, stock: 6 },

  // Terapias de Mano — Herramientas Manuales de Terapia
  { code: 'HMA-01', name: 'Herramienta Manual Acero Sencilla Tipo Garra', subcategoryName: 'Herramientas Manuales de Terapia', weight: 0.3, minStock: 5, stock: 9 },
  { code: 'HMA-02', name: 'Herramienta Manual Acero Sencilla Tipo S', subcategoryName: 'Herramientas Manuales de Terapia', weight: 0.28, minStock: 5, stock: 7 },

  // Suelo Pélvico
  { code: 'TC-05', name: 'Perfect PFE for men Pelvic Floor Exerciser Massage Kit', subcategoryName: 'Ejercitadores de Piso Pélvico', weight: 0.3, minStock: 4, stock: 6 },
  { code: 'TC-06', name: 'Sure PRO Pelvic Floor Exerciser', subcategoryName: 'Ejercitadores de Piso Pélvico', weight: 0.25, minStock: 4, stock: 5 },
  { code: 'TC-08', name: 'Unicare Pelvic Floor Exerciser', subcategoryName: 'Ejercitadores de Piso Pélvico', weight: 0.25, minStock: 4, stock: 7 },
  { code: 'TC-10', name: 'Mynd', subcategoryName: 'Biofeedback y Estimulación Pélvica', weight: 0.4, minStock: 2, stock: 3 },
  { code: 'TC-11', name: 'Mynd Gel Pads Replacment Pads', subcategoryName: 'Biofeedback y Estimulación Pélvica', weight: 0.05, minStock: 10, stock: 18 },
  { code: 'TC-18', name: 'Estimulador Neuromuscular Biofeedback KM530', subcategoryName: 'Biofeedback y Estimulación Pélvica', weight: 0.5, minStock: 2, stock: 4 },
  { code: 'TC-19', name: 'Estimulador Neuromuscular Biofeedback KM531', subcategoryName: 'Biofeedback y Estimulación Pélvica', weight: 0.55, minStock: 2, stock: 2 },
  { code: 'TC-12', name: 'Cables L-CPT TensCare Blanco', subcategoryName: 'Cables y Accesorios Pélvicos', weight: 0.08, minStock: 8, stock: 14 },
  { code: 'TC-13', name: 'Cables L-ST2 TensCare Gris', subcategoryName: 'Cables y Accesorios Pélvicos', weight: 0.08, minStock: 8, stock: 12 },

  // Electroterapia — TENS y EMS
  { code: 'T-01', name: 'Tens Analogo 3000', subcategoryName: 'TENS y EMS', weight: 0.5, minStock: 3, stock: 6 },
  { code: 'T-02', name: 'Tens Digital 7000', subcategoryName: 'TENS y EMS', weight: 0.45, minStock: 3, stock: 5 },
  { code: 'T-05', name: 'Ems Digital 7500', subcategoryName: 'TENS y EMS', weight: 0.48, minStock: 3, stock: 4 },
  { code: 'T-07', name: 'Intensity Twin Stim III Tens/Ems', subcategoryName: 'TENS y EMS', weight: 0.55, minStock: 2, stock: 3 },
  { code: 'T-08', name: 'Twin Stim Plus 2nd Tens/Ems', subcategoryName: 'TENS y EMS', weight: 0.55, minStock: 2, stock: 3 },
  { code: 'T-10', name: 'Twin Stim Plus 3ra Tens/Ems/If/Russian', subcategoryName: 'TENS y EMS', weight: 0.6, minStock: 2, stock: 2 },
  { code: 'T-11', name: 'Caretec IV Digital Tens/Ems/If/Rs', subcategoryName: 'TENS y EMS', weight: 0.65, minStock: 2, stock: 3 },
  { code: 'T-13', name: 'Quattro 2.5 Clinical Electroestimulador Profesional Tens/Ems/If/Rs', subcategoryName: 'TENS y EMS', weight: 1.2, minStock: 2, stock: 2 },
  { code: 'T-14', name: 'Tens Digital Nu-Tek MT9000 Tipo:Básico', subcategoryName: 'TENS y EMS', weight: 0.4, minStock: 4, stock: 7 },
  { code: 'TC-01', name: 'Sports TENS 2 Muscle Toning, Pain Relief', subcategoryName: 'TENS y EMS', weight: 0.3, minStock: 4, stock: 6 },

  // Electroterapia — Ultrasonido
  { code: 'UL-01', name: 'Ultrasonido Portatil US 1000 1Mhz', subcategoryName: 'Ultrasonido', weight: 1.0, minStock: 2, stock: 4 },
  { code: 'UL-02', name: 'Ultrasonido Portatil US PRO 2000 1Mhz', subcategoryName: 'Ultrasonido', weight: 1.1, minStock: 2, stock: 3 },
  { code: 'UL-03', name: 'Ultrasonido Profesional Sound Care Plus 1Mhz - 3Mhz', subcategoryName: 'Ultrasonido', weight: 2.5, minStock: 1, stock: 2 },
  { code: 'UL-05', name: 'Combocare E-Stim Ultrasound Combo Tens/Ems/If/Rs', subcategoryName: 'Ultrasonido', weight: 2.8, minStock: 1, stock: 2 },
  { code: 'UL-06', name: 'Ultrasonido Portatil Nu-Tek UT1032', subcategoryName: 'Ultrasonido', weight: 1.0, minStock: 2, stock: 3 },
  { code: 'UL-07', name: 'Ultrasonido Portatil Compass DU-3035', subcategoryName: 'Ultrasonido', weight: 1.05, minStock: 2, stock: 1 },

  // Electroterapia — Magnetoterapia
  { code: 'MGX-03', name: 'Magnetoterapia LaMagneto Pro', subcategoryName: 'Magnetoterapia', weight: 3.5, minStock: 1, stock: 2 },

  // Electroterapia — Adaptadores
  { code: 'AC-01', name: 'Adaptador US 1000', subcategoryName: 'Adaptadores', weight: 0.2, minStock: 5, stock: 9 },
  { code: 'AC-02', name: 'Adaptador US PRO 2000', subcategoryName: 'Adaptadores', weight: 0.2, minStock: 5, stock: 7 },
  { code: 'AC-04', name: 'Adaptador Masajeador Pistola', subcategoryName: 'Adaptadores', weight: 0.15, minStock: 5, stock: 6 },

  // Electroterapia — Cabezales y Cables
  { code: 'CB-04', name: 'Cabezal de Ultrasonido 1 cm Soundcare Plus', subcategoryName: 'Cabezales y Cables', weight: 0.1, minStock: 4, stock: 6 },
  { code: 'CB-05', name: 'Cabezal de Ultrasonido 5 cm Soundcare Plus', subcategoryName: 'Cabezales y Cables', weight: 0.12, minStock: 4, stock: 5 },
  { code: 'CB-06', name: 'Cable Conector SoundCare - Rojo', subcategoryName: 'Cabezales y Cables', weight: 0.07, minStock: 8, stock: 10 },
  { code: 'CB-07', name: 'Cable Conector SoundCare/ComboCare', subcategoryName: 'Cabezales y Cables', weight: 0.07, minStock: 8, stock: 9 },
  { code: 'CB-02', name: 'Cables Quattro 2.5', subcategoryName: 'Cabezales y Cables', weight: 0.06, minStock: 8, stock: 12 },
  { code: 'CB-01', name: 'Juegos De Cables Hembra Para Tens x 2 und Roscoe', subcategoryName: 'Cabezales y Cables', weight: 0.05, minStock: 10, stock: 18 },
  { code: 'CB-08', name: 'Cables Hembra ICMTHERAPY Tens x 2 und', subcategoryName: 'Cabezales y Cables', weight: 0.05, minStock: 10, stock: 14 },

  // Electroterapia — Electrodos y Geles
  { code: 'EL-01', name: 'Electrodos Adhesivos Cuadrados 5x5', subcategoryName: 'Electrodos y Geles', weight: 0.1, minStock: 20, stock: 35 },
  { code: 'EL-04', name: 'Electrodo Adhesivo Rectangular 9x5', subcategoryName: 'Electrodos y Geles', weight: 0.12, minStock: 20, stock: 28 },
  { code: 'GL-03', name: 'Gel Conductivo Gl X 3785 ml', subcategoryName: 'Electrodos y Geles', weight: 4.0, minStock: 6, stock: 10 },

  // Electroterapia — Termoterapia y Vapor
  { code: 'TH-02', name: 'Tanque Hidrocolector Relief Pak X6', subcategoryName: 'Termoterapia y Vapor', weight: 12.0, minStock: 1, stock: 2 },
  { code: 'TP-04', name: 'Tanque Difusor de Parafina ICMTHERAPY 3 Lb', subcategoryName: 'Termoterapia y Vapor', weight: 4.5, minStock: 2, stock: 3 },
  { code: 'NB-05', name: 'Nebulizador Compresor ICMTHERAPY', subcategoryName: 'Termoterapia y Vapor', weight: 1.5, minStock: 2, stock: 4 },

  // Pelotas — Pelotas de Gel
  { code: 'PGC-01', name: 'Pelota de Gel Circular 4.5cm Amarilla 15lbs', subcategoryName: 'Pelotas de Gel', weight: 0.1, minStock: 10, stock: 18 },
  { code: 'PGC-02', name: 'Pelota de Gel Circular 4.5cm Naranja 18lbs', subcategoryName: 'Pelotas de Gel', weight: 0.1, minStock: 10, stock: 16 },
  { code: 'PGC-03', name: 'Pelota de Gel Circular 4.5cm Verde 20lbs', subcategoryName: 'Pelotas de Gel', weight: 0.1, minStock: 10, stock: 14 },
  { code: 'PGC-04', name: 'Pelota de Gel Circular 4.5cm Rojo 25lbs', subcategoryName: 'Pelotas de Gel', weight: 0.1, minStock: 10, stock: 12 },
  { code: 'PGC-05', name: 'Pelota de Gel Circular 4.5cm Azul 30lbs', subcategoryName: 'Pelotas de Gel', weight: 0.1, minStock: 10, stock: 9 },
  { code: 'PGO-01', name: 'Pelota de Gel Ovalada 6.5 cm Amarilla 15lbs', subcategoryName: 'Pelotas de Gel', weight: 0.13, minStock: 10, stock: 17 },
  { code: 'PGO-02', name: 'Pelota de Gel Ovalada 6.5 cm Naranja 18lbs', subcategoryName: 'Pelotas de Gel', weight: 0.13, minStock: 10, stock: 15 },
  { code: 'PGO-03', name: 'Pelota de Gel Ovalada 6.5 cm Roja 25lbs', subcategoryName: 'Pelotas de Gel', weight: 0.13, minStock: 10, stock: 13 },
  { code: 'PGO-04', name: 'Pelota de Gel Ovalada 6.5 cm Azul 30lbs', subcategoryName: 'Pelotas de Gel', weight: 0.13, minStock: 10, stock: 10 },
  { code: 'PGO-05', name: 'Pelota de Gel Ovalada 6.5 cm Verde 20lbs', subcategoryName: 'Pelotas de Gel', weight: 0.13, minStock: 10, stock: 11 },

  // Pelotas — Pelotas Fortalecedoras
  { code: 'PFD-01', name: 'Pelota Fortalecedor Dedos y Manos 10 Lbs Azul', subcategoryName: 'Pelotas Fortalecedoras', weight: 0.15, minStock: 8, stock: 14 },
  { code: 'SAR-01', name: 'Set De Agarre Redondo-Malla Pelota 10.5cm x 3 piezas', subcategoryName: 'Pelotas Fortalecedoras', weight: 0.3, minStock: 6, stock: 10 },

  // Pelotas — Balones y Balancines
  { code: 'APB-01', name: 'Balancin 33cm azul con inflador', subcategoryName: 'Balones y Balancines', weight: 1.2, minStock: 3, stock: 5 },
  { code: 'BBM-01', name: 'Balón Bousu con Manillas 58*24cm Azul', subcategoryName: 'Balones y Balancines', weight: 2.0, minStock: 2, stock: 4 },

  // Bandas — Bandas de Resistencia
  { code: 'BC-01', name: 'Set de Bandas De Latex Cerradas x 5 Colores', subcategoryName: 'Bandas de Resistencia', weight: 0.3, minStock: 8, stock: 14 },
  { code: 'BOR-01', name: 'Bandas De Oclusion de Resistencia Brazos y Piernas', subcategoryName: 'Bandas de Resistencia', weight: 0.25, minStock: 6, stock: 9 },
  { code: 'BP-08', name: 'Banda Precortada Amarilla X 1.50', subcategoryName: 'Bandas de Resistencia', weight: 0.05, minStock: 15, stock: 25 },
  { code: 'BP-09', name: 'Banda Precortada Rojo X 1.50', subcategoryName: 'Bandas de Resistencia', weight: 0.05, minStock: 15, stock: 22 },
  { code: 'BP-10', name: 'Banda Precortada Verde X 1.50', subcategoryName: 'Bandas de Resistencia', weight: 0.05, minStock: 15, stock: 20 },
  { code: 'BP-11', name: 'Banda Precortada Azul X 1.50', subcategoryName: 'Bandas de Resistencia', weight: 0.05, minStock: 15, stock: 18 },
  { code: 'BP-12', name: 'Banda Precortada Negra X 1.50', subcategoryName: 'Bandas de Resistencia', weight: 0.05, minStock: 15, stock: 16 },
  { code: 'BP-13', name: 'Banda Precortada Gris X 1.50', subcategoryName: 'Bandas de Resistencia', weight: 0.05, minStock: 15, stock: 13 },
  { code: 'BP-14', name: 'Banda Precortada Dorada X 1.50', subcategoryName: 'Bandas de Resistencia', weight: 0.05, minStock: 15, stock: 12 },
  { code: 'RLF-04', name: 'Rollo de Banda Azul x 45 Mts Latex Free', subcategoryName: 'Bandas de Resistencia', weight: 1.5, minStock: 3, stock: 5 },
  { code: 'RLF-05', name: 'Rollo de Banda Negro x 45 Mts Latex Free', subcategoryName: 'Bandas de Resistencia', weight: 1.5, minStock: 3, stock: 4 },
  { code: 'RLF-06', name: 'Rollo de Banda Gris x 45 Mts Latex Free', subcategoryName: 'Bandas de Resistencia', weight: 1.5, minStock: 3, stock: 3 },
  { code: 'RLF-07', name: 'Rollo de Banda Dorada x 45 Mts Latex Free', subcategoryName: 'Bandas de Resistencia', weight: 1.5, minStock: 3, stock: 2 },

  // Bandas — Bandas para Dedos
  { code: 'BC-02', name: 'Set de Bandas Para dedos x 5 unidades', subcategoryName: 'Bandas para Dedos', weight: 0.08, minStock: 10, stock: 16 },

  // Bandas — Mallas de Resistencia
  { code: 'MG-02', name: 'Mallas Grandes Amarilla 36cm', subcategoryName: 'Mallas de Resistencia', weight: 0.2, minStock: 8, stock: 14 },
  { code: 'MG-03', name: 'Mallas Grandes Roja 36cm', subcategoryName: 'Mallas de Resistencia', weight: 0.2, minStock: 8, stock: 12 },
  { code: 'MG-04', name: 'Mallas Grandes Verde 36cm', subcategoryName: 'Mallas de Resistencia', weight: 0.2, minStock: 8, stock: 10 },
  { code: 'MG-05', name: 'Mallas Grandes Azul 36cm', subcategoryName: 'Mallas de Resistencia', weight: 0.2, minStock: 8, stock: 9 },
  { code: 'MG-06', name: 'Mallas Grandes Negra 36cm', subcategoryName: 'Mallas de Resistencia', weight: 0.2, minStock: 8, stock: 7 },
  { code: 'MG-07', name: 'Mallas Grandes Doble Resiste Ama/verde 36cm', subcategoryName: 'Mallas de Resistencia', weight: 0.22, minStock: 6, stock: 8 },
  { code: 'MG-08', name: 'Mallas Grandes Doble Resiste Azul/Roja 36CM', subcategoryName: 'Mallas de Resistencia', weight: 0.22, minStock: 6, stock: 6 },
  { code: 'MPQ-02', name: 'Malla Pequeña Amarilla 18cm', subcategoryName: 'Mallas de Resistencia', weight: 0.12, minStock: 10, stock: 16 },
  { code: 'MPQ-03', name: 'Malla Pequeña Roja 18cm', subcategoryName: 'Mallas de Resistencia', weight: 0.12, minStock: 10, stock: 14 },
  { code: 'MPQ-04', name: 'Malla Pequeña Verde 18cm', subcategoryName: 'Mallas de Resistencia', weight: 0.12, minStock: 10, stock: 12 },
  { code: 'MPQ-05', name: 'Malla Pequeña Azul 18cm', subcategoryName: 'Mallas de Resistencia', weight: 0.12, minStock: 10, stock: 11 },
  { code: 'MPQ-06', name: 'Malla Pequeña Negra 18cm', subcategoryName: 'Mallas de Resistencia', weight: 0.12, minStock: 10, stock: 9 },

  // Bandas — Sistemas de Suspensión y BFR
  { code: 'KBS-01', name: 'Kit de Bandas de Suspension TRX', subcategoryName: 'Sistemas de Suspensión y BFR', weight: 1.0, minStock: 3, stock: 5 },
  { code: 'KRFS-01', name: 'BFR- Kit de Restriccion de Flujo Sanguineo', subcategoryName: 'Sistemas de Suspensión y BFR', weight: 0.6, minStock: 2, stock: 3 },

  // Masajeadores — Masajeadores Eléctricos
  { code: 'BMV-01', name: 'Bola de Masaje Vibrante', subcategoryName: 'Masajeadores Eléctricos', weight: 0.3, minStock: 4, stock: 7 },
  { code: 'MPC-01', name: 'Masajeador de Piernas con compresor de Aire Sencillo Talla M', subcategoryName: 'Masajeadores Eléctricos', weight: 3.5, minStock: 2, stock: 3 },
  { code: 'MPC-01A', name: 'Masajeador de Piernas con compresor de Aire Sencillo Talla L', subcategoryName: 'Masajeadores Eléctricos', weight: 3.8, minStock: 2, stock: 2 },
  { code: 'MPC-02', name: 'Masajeador de Piernas y Brazos con compresor de Aire Talla M', subcategoryName: 'Masajeadores Eléctricos', weight: 4.2, minStock: 1, stock: 2 },
  { code: 'MPC-02A', name: 'Masajeador de Piernas y Brazos con compresor de Aire Talla L', subcategoryName: 'Masajeadores Eléctricos', weight: 4.5, minStock: 1, stock: 1 },
  { code: 'MPC-03', name: 'Masajeador con compresor de Aire', subcategoryName: 'Masajeadores Eléctricos', weight: 3.0, minStock: 2, stock: 3 },
  { code: 'MTP-001', name: 'Masajeador Tipo Pistola Frio/calor WS-059', subcategoryName: 'Masajeadores Eléctricos', weight: 1.0, minStock: 3, stock: 5 },
  { code: 'MTP-002', name: 'Masajeador Tipo Pistola Calor WS-020', subcategoryName: 'Masajeadores Eléctricos', weight: 0.9, minStock: 3, stock: 4 },
  { code: 'MTP-003', name: 'Masajeador Tipo Pistola Sencillo WS-061', subcategoryName: 'Masajeadores Eléctricos', weight: 0.8, minStock: 3, stock: 6 },
  { code: 'CB-09', name: 'Cabezal Frio/calor Del Masajeador Pistola', subcategoryName: 'Masajeadores Eléctricos', weight: 0.15, minStock: 5, stock: 9 },

  // Masajeadores — Rodillos y Herramientas de Masaje Manual
  { code: 'MDR-01', name: 'Masajeador de Rodilla', subcategoryName: 'Rodillos y Herramientas de Masaje Manual', weight: 0.4, minStock: 5, stock: 8 },
  { code: 'BGM-02', name: 'Barra de Masaje en Y Rodillo Corporal', subcategoryName: 'Rodillos y Herramientas de Masaje Manual', weight: 0.5, minStock: 4, stock: 7 },
  { code: 'RY-01', name: 'Rodillo de Yoga Grande Gris+Negro 14*45cm', subcategoryName: 'Rodillos y Herramientas de Masaje Manual', weight: 0.7, minStock: 3, stock: 5 },
  { code: 'RY-03', name: 'Rodillo de Yoga Verde/Blanco 33cm', subcategoryName: 'Rodillos y Herramientas de Masaje Manual', weight: 0.5, minStock: 3, stock: 6 },
  { code: 'RY-04', name: 'Rodillo de Yoga Azul/Blanco 33cm', subcategoryName: 'Rodillos y Herramientas de Masaje Manual', weight: 0.5, minStock: 3, stock: 4 },
  { code: 'SHM-02', name: 'Set De Herramienta de Masaje en Acero por 8 unidades', subcategoryName: 'Rodillos y Herramientas de Masaje Manual', weight: 1.2, minStock: 2, stock: 4 },
  { code: 'SHM-03', name: 'Set De Herramienta de Masaje Manual Punto Gatillo x 3 unidades', subcategoryName: 'Rodillos y Herramientas de Masaje Manual', weight: 0.6, minStock: 3, stock: 5 },

  // Masajeadores — Terapia de Frío
  { code: 'BH-01', name: 'Bañera De Hielo Ice Tub -01', subcategoryName: 'Terapia de Frío', weight: 5.0, minStock: 1, stock: 2 },
  { code: 'CH-01', name: 'Herramienta De Masaje Con Hielo', subcategoryName: 'Terapia de Frío', weight: 0.3, minStock: 4, stock: 6 },

  // Cintas
  { code: 'CD-01', name: 'Cinta Deportiva ICM THERAPY Rosada', subcategoryName: 'Cintas Deportivas', weight: 0.05, minStock: 15, stock: 24 },
  { code: 'CD-04', name: 'Cinta Deportiva ICM THERAPY Verde', subcategoryName: 'Cintas Deportivas', weight: 0.05, minStock: 15, stock: 20 },

  // Pedales — Pedales Ejercitadores
  { code: 'PD-03', name: 'Pedal Ejercitador Icm Therapy', subcategoryName: 'Pedales Ejercitadores', weight: 2.5, minStock: 3, stock: 5 },
  { code: 'PD-06', name: 'Pedal Ejercitador Electrico ICMTHERAPY', subcategoryName: 'Pedales Ejercitadores', weight: 3.2, minStock: 2, stock: 3 },

  // Pedales — Patines de Estiramiento
  { code: 'PD-04', name: 'Pedal de Estiramiento Sencillo (Patin) - Negro', subcategoryName: 'Patines de Estiramiento', weight: 0.6, minStock: 5, stock: 9 },
  { code: 'PD-05', name: 'Pedal de Estiramiento Sencillo (Patin) - Azul', subcategoryName: 'Patines de Estiramiento', weight: 0.6, minStock: 5, stock: 7 },

  // Accesorios — Equipos de Medición
  { code: 'DND-01', name: 'Dinamometro Digital Negro', subcategoryName: 'Equipos de Medición', weight: 0.4, minStock: 3, stock: 5 },
  { code: 'AD-01', name: 'Adipometro Slim Guide Blanco', subcategoryName: 'Equipos de Medición', weight: 0.2, minStock: 4, stock: 7 },
  { code: 'AD-02', name: 'Adipometro Slim Guide Negro', subcategoryName: 'Equipos de Medición', weight: 0.2, minStock: 4, stock: 6 },
  { code: 'IMA-01', name: 'Instrumento de Medicion de Altura (Tallimetro)', subcategoryName: 'Equipos de Medición', weight: 3.0, minStock: 1, stock: 2 },
  { code: 'IN-01', name: 'Inclinometro de Burbuja Baseline', subcategoryName: 'Equipos de Medición', weight: 0.15, minStock: 3, stock: 4 },
  { code: 'SG-01', name: 'Set de Goniometros x 6 Piezas', subcategoryName: 'Equipos de Medición', weight: 0.5, minStock: 3, stock: 5 },

  // Accesorios — Entrenamiento de Agilidad
  { code: 'LDE-01', name: 'Luz De Entrenamiento De Reaccion y Agilidad', subcategoryName: 'Entrenamiento de Agilidad', weight: 0.5, minStock: 2, stock: 4 },
  { code: 'RDHA-01', name: 'Rueda De Hombro Ajustable Digital', subcategoryName: 'Entrenamiento de Agilidad', weight: 1.8, minStock: 2, stock: 3 },
  { code: 'CTE-01', name: 'Cajon Tipo Escalera', subcategoryName: 'Entrenamiento de Agilidad', weight: 6.0, minStock: 1, stock: 2 },
  { code: 'ECR-01', name: 'Escalera Con Rampa', subcategoryName: 'Entrenamiento de Agilidad', weight: 8.0, minStock: 1, stock: 2 },
  { code: 'EEM-01', name: 'Escalera de Entrenamiento De Marcha para Rehabilitacion', subcategoryName: 'Entrenamiento de Agilidad', weight: 7.5, minStock: 1, stock: 1 },
  { code: 'BPM-02', name: 'Barras Paralelas x 2Mts', subcategoryName: 'Entrenamiento de Agilidad', weight: 15.0, minStock: 1, stock: 2 },

  // Accesorios — Termoterapia Personal
  { code: 'PEM-01', name: 'Thera Med Profesional Heanting Pad (Medium) Estándar 30x38cm', subcategoryName: 'Termoterapia Personal', weight: 0.8, minStock: 4, stock: 7 },
  { code: 'PEK-02', name: 'Thera Med Profesional Heanting Pad (King) Estándar 30x60cm', subcategoryName: 'Termoterapia Personal', weight: 1.1, minStock: 4, stock: 6 },
  { code: 'CF-02', name: 'Compresa Fria Vinilo Cervical Relief Pak 15 x 58cm', subcategoryName: 'Termoterapia Personal', weight: 0.6, minStock: 6, stock: 10 },
  { code: 'CFCG-01', name: 'Compresa Fria/caliente Gel Lite Mediana Relief Pak 12.5 x 25cm', subcategoryName: 'Termoterapia Personal', weight: 0.3, minStock: 8, stock: 14 },

  // Accesorios — Estiramiento y Movilidad
  { code: 'CMA-02', name: 'Correa De Estiramiento Elastica', subcategoryName: 'Estiramiento y Movilidad', weight: 0.2, minStock: 6, stock: 11 },
  { code: 'CMA-03', name: 'Correa De Estiramiento Fija con Soporte para Pie', subcategoryName: 'Estiramiento y Movilidad', weight: 0.35, minStock: 5, stock: 8 },
  { code: 'CE-01', name: 'Cojin de Equilibrio - Minibalancines 16*9cm Verde', subcategoryName: 'Estiramiento y Movilidad', weight: 0.15, minStock: 6, stock: 10 },
  { code: 'CE-03', name: 'Cojin de Equilibrio - Minibalancines 16*9cm Rojo', subcategoryName: 'Estiramiento y Movilidad', weight: 0.15, minStock: 6, stock: 9 },
  { code: 'CE-04', name: 'Cojin de Equilibrio - Minibalancines 16*9cm Azul', subcategoryName: 'Estiramiento y Movilidad', weight: 0.15, minStock: 6, stock: 8 },
  { code: 'CE-05', name: 'Cojin de Equilibrio - Minibalancines 16*9cm Naranja', subcategoryName: 'Estiramiento y Movilidad', weight: 0.15, minStock: 6, stock: 7 },
  { code: 'CE-06', name: 'Cojin de Equilibrio - Minibalancines 16*9cm Amarillo', subcategoryName: 'Estiramiento y Movilidad', weight: 0.15, minStock: 6, stock: 6 },

  // Accesorios — Modelos Anatómicos
  { code: 'MAC-01', name: 'Modelo Anatómico Columna Vertebral', subcategoryName: 'Modelos Anatómicos', weight: 1.5, minStock: 2, stock: 3 },
  { code: 'MAP-02', name: 'Modelo Anatómico De Pelvis', subcategoryName: 'Modelos Anatómicos', weight: 1.0, minStock: 2, stock: 3 },

  // Accesorios — Pesas y Fitness
  { code: 'MN-01', name: 'Mancuernas de Neopreno 1Kl', subcategoryName: 'Pesas y Fitness', weight: 1.0, minStock: 6, stock: 10 },
  { code: 'MN-02', name: 'Mancuernas de Neopreno 2Kl', subcategoryName: 'Pesas y Fitness', weight: 2.0, minStock: 6, stock: 9 },
  { code: 'MN-03', name: 'Mancuernas de Neopreno 3Kl', subcategoryName: 'Pesas y Fitness', weight: 3.0, minStock: 6, stock: 7 },
  { code: 'EC-01b', name: 'Pesas de Tobillo x 2unid Negro+ Azul 3kl', subcategoryName: 'Pesas y Fitness', weight: 3.0, minStock: 4, stock: 6 },
  { code: 'SF-01', name: 'Set Fitness x 5 piezas', subcategoryName: 'Pesas y Fitness', weight: 1.5, minStock: 4, stock: 7 },

  // Accesorios — Instrumental Clínico
  { code: 'TCT-01', name: 'Tijera de Trauma - Corta todo 15.5cm', subcategoryName: 'Instrumental Clínico', weight: 0.1, minStock: 8, stock: 12 },
  { code: 'TCT-02', name: 'Tijera de Trauma - Corta todo 18.5cm', subcategoryName: 'Instrumental Clínico', weight: 0.12, minStock: 8, stock: 10 },
];

async function seed(): Promise<void> {
  await AppDataSource.initialize();

  const categoryRepo = AppDataSource.getRepository(Category);
  const subcategoryRepo = AppDataSource.getRepository(Subcategory);
  const productRepo = AppDataSource.getRepository(Product);
  const clientRepo = AppDataSource.getRepository(Client);
  const userRepo = AppDataSource.getRepository(User);
  const movementRepo = AppDataSource.getRepository(Movement);

  if ((await categoryRepo.count()) > 0) {
    console.log('La base de datos ya contiene categorías. Seed omitido para evitar duplicados.');
    await AppDataSource.destroy();
    return;
  }

  const categories = await categoryRepo.save(categoryRepo.create(CATEGORIES));
  const cat = new Map(categories.map((c) => [c.name, c]));

  const subcategories = await subcategoryRepo.save(
    subcategoryRepo.create(
      SUBCATEGORIES.map((s) => ({ name: s.name, categoryId: cat.get(s.categoryName)!.id })),
    ),
  );
  const sub = new Map(subcategories.map((s) => [s.name, s]));

  const products = await productRepo.save(
    productRepo.create(
      PRODUCTS.map((p) => ({
        code: p.code,
        name: p.name,
        subcategoryId: sub.get(p.subcategoryName)!.id,
        weight: p.weight,
        requiresRefrigeration: false,
        stock: p.stock,
        stockBodega: p.stock,
        stockVitrina: 0,
        minStock: p.minStock,
        serialNumber: null,
        barcode: null,
      })),
    ),
  );

  const prod = new Map(products.map((p) => [p.code, p]));

  const clients = await clientRepo.save(
    clientRepo.create([
      { name: 'Centro de Rehabilitación Integral', clientType: ClientType.MAYORISTA, phone: '6024123456', address: 'Calle 5 # 24-50', city: 'Cali', email: 'compras@crintegral.com.co' },
      { name: 'Clínica Fisioterapéutica Los Andes', clientType: ClientType.MAYORISTA, phone: '6013456789', address: 'Carrera 7 # 32-18', city: 'Bogotá', email: 'pedidos@fisioandes.com.co' },
      { name: 'IPS FisioSalud', clientType: ClientType.MAYORISTA, phone: '6044567890', address: 'Carrera 80 # 45-12', city: 'Medellín', email: 'abastecimiento@ipsfisiosaludmed.co' },
      { name: 'Consultorio Fisioterapéutico Torres', clientType: ClientType.DETAL, phone: '3162345678', address: 'Calle 19 # 8-23', city: 'Pereira', email: null },
      { name: 'María Alejandra Vargas', clientType: ClientType.DETAL, phone: '3112345678', address: null, city: 'Cali', email: null },
      { name: 'Clínica del Movimiento', clientType: ClientType.MAYORISTA, phone: '6054678901', address: 'Carrera 46 # 70-21', city: 'Barranquilla', email: 'compras@clinicamovimiento.co' },
      { name: 'Roberto Gómez Castro', clientType: ClientType.DETAL, phone: '3123456789', address: 'Carrera 23 # 12-45', city: 'Manizales', email: null },
      { name: 'Hospital Regional Sur', clientType: ClientType.MAYORISTA, phone: '6027890123', address: 'Avenida Colombia # 15-30', city: 'Pasto', email: 'logistica@hospitalregionalsur.gov.co' },
    ]),
  );

  const cli = new Map(clients.map((c) => [c.name, c]));

  const users = await userRepo.save(
    await Promise.all(
      [
        { nombre: 'Carlos', apellido: 'Mendoza', email: 'admin@stockly.com', rol: UserRole.ADMIN, rawPassword: 'Admin123!' },
        { nombre: 'Laura', apellido: 'Gómez', email: 'almacenista@stockly.com', rol: UserRole.ALMACENISTA, rawPassword: 'Store123!' },
        { nombre: 'Pedro', apellido: 'Ríos', email: 'despachador@stockly.com', rol: UserRole.DESPACHADOR, rawPassword: 'Desp123!' },
        { nombre: 'Ana', apellido: 'Torres', email: 'visualizador@stockly.com', rol: UserRole.VISUALIZADOR, rawPassword: 'View123!' },
      ].map(async ({ rawPassword, ...rest }) =>
        userRepo.create({ ...rest, password: await bcrypt.hash(rawPassword, 12) }),
      ),
    ),
  );

  const admin = users.find((u) => u.email === 'admin@stockly.com')!;
  const almacenista = users.find((u) => u.email === 'almacenista@stockly.com')!;
  const despachador = users.find((u) => u.email === 'despachador@stockly.com')!;

  const movements = await movementRepo.save(
    movementRepo.create([
      { type: MovementType.ENTRADA, productId: prod.get('CM-01')!.id, quantity: 4, userId: almacenista.id, date: daysAgo(6), observations: 'Recepción proveedor camillas WT231A', targetLocation: LocationType.BODEGA },
      { type: MovementType.ENTRADA, productId: prod.get('AGJ-01')!.id, quantity: 50, userId: almacenista.id, date: daysAgo(6, 11), observations: 'Recepción proveedor agujas de punción seca', targetLocation: LocationType.BODEGA },
      { type: MovementType.ENTRADA, productId: prod.get('T-02')!.id, quantity: 6, userId: almacenista.id, date: daysAgo(5), observations: 'Recepción equipos TENS digitales', targetLocation: LocationType.BODEGA },
      { type: MovementType.ENTRADA, productId: prod.get('EL-01')!.id, quantity: 40, userId: almacenista.id, date: daysAgo(5, 11), observations: 'Ingreso electrodos adhesivos', targetLocation: LocationType.BODEGA },
      { type: MovementType.ENTRADA, productId: prod.get('UL-01')!.id, quantity: 5, userId: almacenista.id, date: daysAgo(4), observations: 'Recepción ultrasonido portátil', targetLocation: LocationType.BODEGA },
      { type: MovementType.VENTA, productId: prod.get('AGJ-01')!.id, quantity: 12, userId: despachador.id, date: daysAgo(4, 14), clientId: cli.get('Centro de Rehabilitación Integral')!.id, clientType: ClientType.MAYORISTA, sourceLocation: LocationType.BODEGA },
      { type: MovementType.ENTRADA, productId: prod.get('PGC-01')!.id, quantity: 20, userId: almacenista.id, date: daysAgo(3), observations: 'Reposición pelotas de gel', targetLocation: LocationType.BODEGA },
      { type: MovementType.TRASLADO, productId: prod.get('EL-01')!.id, quantity: 10, userId: almacenista.id, date: daysAgo(3, 10), observations: 'Reabastecimiento vitrina sala de espera', sourceLocation: LocationType.BODEGA, targetLocation: LocationType.VITRINA },
      { type: MovementType.VENTA, productId: prod.get('ED-02')!.id, quantity: 2, userId: despachador.id, date: daysAgo(3, 15), clientId: cli.get('Clínica Fisioterapéutica Los Andes')!.id, clientType: ClientType.MAYORISTA, sourceLocation: LocationType.BODEGA },
      { type: MovementType.VENTA, productId: prod.get('T-02')!.id, quantity: 1, userId: despachador.id, date: daysAgo(2), clientId: cli.get('Consultorio Fisioterapéutico Torres')!.id, clientType: ClientType.DETAL, sourceLocation: LocationType.BODEGA },
      { type: MovementType.AJUSTE_INGRESO, productId: prod.get('MN-01')!.id, quantity: 3, userId: admin.id, date: daysAgo(2, 11), observations: 'Ajuste inventario físico — diferencia positiva', targetLocation: LocationType.BODEGA },
      { type: MovementType.ENTRADA, productId: prod.get('BP-08')!.id, quantity: 30, userId: almacenista.id, date: daysAgo(2, 14), observations: 'Recepción bandas precortadas', targetLocation: LocationType.BODEGA },
      { type: MovementType.VENTA, productId: prod.get('CM-01')!.id, quantity: 1, userId: despachador.id, date: daysAgo(1), clientId: cli.get('IPS FisioSalud')!.id, clientType: ClientType.MAYORISTA, sourceLocation: LocationType.BODEGA },
      { type: MovementType.VENTA, productId: prod.get('EL-01')!.id, quantity: 15, userId: despachador.id, date: daysAgo(1, 14), clientId: cli.get('Consultorio Fisioterapéutico Torres')!.id, clientType: ClientType.DETAL, sourceLocation: LocationType.BODEGA },
      { type: MovementType.VENTA, productId: prod.get('PGC-01')!.id, quantity: 6, userId: despachador.id, date: daysAgo(0), clientId: cli.get('Centro de Rehabilitación Integral')!.id, clientType: ClientType.MAYORISTA, sourceLocation: LocationType.BODEGA },
      { type: MovementType.VENTA, productId: prod.get('FL-01')!.id, quantity: 4, userId: despachador.id, date: daysAgo(0, 11), clientId: cli.get('IPS FisioSalud')!.id, clientType: ClientType.MAYORISTA, sourceLocation: LocationType.BODEGA },
      { type: MovementType.ENTRADA, productId: prod.get('MPC-01')!.id, quantity: 2, userId: almacenista.id, date: daysAgo(0, 14), observations: 'Recepción equipos de compresión de aire', targetLocation: LocationType.BODEGA },
      { type: MovementType.VENTA, productId: prod.get('DGC-01')!.id, quantity: 5, userId: despachador.id, date: daysAgo(0, 16), clientId: cli.get('Clínica del Movimiento')!.id, clientType: ClientType.MAYORISTA, sourceLocation: LocationType.BODEGA },
    ]),
  );

  console.log('\n=== Seed completado ===');
  console.log(`Categorías insertadas:    ${categories.length}`);
  console.log(`Subcategorías insertadas: ${subcategories.length}`);
  console.log(`Productos insertados:     ${products.length}`);
  console.log(`Clientes insertados:      ${clients.length}`);
  console.log(`Usuarios insertados:      ${users.length}`);
  console.log(`Movimientos insertados:   ${movements.length}`);
  console.log('\nUsuarios creados:');
  console.log('  admin@stockly.com        → Admin123!   (Admin)');
  console.log('  almacenista@stockly.com  → Store123!   (Almacenista)');
  console.log('  despachador@stockly.com  → Desp123!    (Despachador)');
  console.log('  visualizador@stockly.com → View123!    (Visualizador)');

  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Error ejecutando seed:', err);
  process.exit(1);
});
