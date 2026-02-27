export interface Therapist {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  reviews: number;
  image: string;
  bio: string;
  experience: string;
  price: number;
}

export interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
  therapistId: string;
  date: string;
}

export interface Session {
  id: string;
  therapistId: string;
  therapistName: string;
  clientId: string;
  clientName: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  price: number;
  specialty: string;
}

export interface Order {
  id: string;
  sessionId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  paymentMethod: string;
  date: string;
}

export const SPECIALTIES = [
  'Todos',
  'Masajes Terapéuticos',
  'Yoga',
  'Meditación',
  'Acupuntura',
  'Fisioterapia',
  'Nutrición',
  'Reiki'
];

export const mockTherapists: Therapist[] = [
  {
    id: '1',
    name: 'Dr. Carlos Méndez',
    specialty: 'Masajes Terapéuticos',
    rating: 4.9,
    reviews: 124,
    image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop',
    bio: 'Especialista en masajes terapéuticos con 10 años de experiencia. Certificado en técnicas de liberación miofascial y masaje deportivo.',
    experience: '10 años de experiencia',
    price: 80
  },
  {
    id: '2',
    name: 'Ana Martínez',
    specialty: 'Yoga',
    rating: 4.8,
    reviews: 98,
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    bio: 'Instructora de Yoga certificada en Hatha y Vinyasa. Enfoque en bienestar integral y mindfulness.',
    experience: '8 años de experiencia',
    price: 60
  },
  {
    id: '3',
    name: 'Laura Sánchez',
    specialty: 'Acupuntura',
    rating: 4.9,
    reviews: 156,
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop',
    bio: 'Acupunturista con maestría en Medicina Tradicional China. Especializada en manejo del dolor y balance energético.',
    experience: '12 años de experiencia',
    price: 90
  },
  {
    id: '4',
    name: 'Roberto Díaz',
    specialty: 'Fisioterapia',
    rating: 4.7,
    reviews: 89,
    image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=400&fit=crop',
    bio: 'Fisioterapeuta deportivo especializado en recuperación de lesiones y rehabilitación.',
    experience: '7 años de experiencia',
    price: 75
  },
  {
    id: '5',
    name: 'Sofia Ramírez',
    specialty: 'Meditación',
    rating: 4.9,
    reviews: 143,
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop',
    bio: 'Instructora de meditación mindfulness y técnicas de reducción de estrés basadas en atención plena.',
    experience: '9 años de experiencia',
    price: 50
  },
  {
    id: '6',
    name: 'Miguel Torres',
    specialty: 'Nutrición',
    rating: 4.8,
    reviews: 112,
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop',
    bio: 'Nutricionista clínico especializado en planes de alimentación personalizados y bienestar holístico.',
    experience: '11 años de experiencia',
    price: 70
  }
];

export const mockSessions: Session[] = [
  {
    id: '1',
    therapistId: '1',
    therapistName: 'Dr. Carlos Méndez',
    clientId: 'client-1',
    clientName: 'María González',
    date: '2026-02-24',
    time: '10:00',
    status: 'confirmed',
    price: 80,
    specialty: 'Masajes Terapéuticos'
  },
  {
    id: '2',
    therapistId: '2',
    therapistName: 'Ana Martínez',
    clientId: 'client-1',
    clientName: 'María González',
    date: '2026-02-26',
    time: '14:00',
    status: 'pending',
    price: 60,
    specialty: 'Yoga'
  },
  {
    id: '3',
    therapistId: '3',
    therapistName: 'Laura Sánchez',
    clientId: 'client-1',
    clientName: 'María González',
    date: '2026-02-18',
    time: '16:00',
    status: 'completed',
    price: 90,
    specialty: 'Acupuntura'
  }
];

export const generateTimeSlots = (therapistId: string, date: string): TimeSlot[] => {
  const times = [
    '09:00', '10:00', '11:00', '12:00',
    '14:00', '15:00', '16:00', '17:00', '18:00'
  ];
  
  return times.map((time, index) => ({
    id: `slot-${therapistId}-${date}-${index}`,
    time,
    available: Math.random() > 0.3, // 70% available
    therapistId,
    date
  }));
};
