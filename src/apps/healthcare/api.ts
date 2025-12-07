// Healthcare Module API Functions
import { prisma } from '@/lib/prisma';
import type { Patient, MedicalAppointment, MedicalRecord } from './types';

const client = prisma as any;

// Patients
export async function getPatients(tenantId: string) {
  return await client.patient.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getPatientById(id: string, tenantId: string) {
  return await client.patient.findFirst({
    where: { id, tenantId },
  });
}

export async function createPatient(data: Partial<Patient> & { tenantId: string }) {
  return await client.patient.create({
    data: {
      patientNumber: data.patientNumber || `PAT-${Date.now()}`,
      firstName: data.firstName!,
      lastName: data.lastName!,
      dateOfBirth: data.dateOfBirth!,
      gender: data.gender!,
      contactNumber: data.contactNumber,
      email: data.email,
      address: data.address,
      emergencyContact: data.emergencyContact,
      bloodGroup: data.bloodGroup,
      tenantId: data.tenantId,
    },
  });
}

export async function updatePatient(
  id: string,
  data: Partial<Patient>,
  tenantId: string
) {
  return await client.patient.update({
    where: { id, tenantId },
    data,
  });
}

export async function searchPatients(query: string, tenantId: string) {
  return await client.patient.findMany({
    where: {
      OR: [
        { firstName: { contains: query } },
        { lastName: { contains: query } },
        { patientNumber: { contains: query } },
      ],
      tenantId,
    },
  });
}

// Medical Appointments
export async function getAppointments(tenantId: string, date?: Date) {
  const where: any = { tenantId };
  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    where.appointmentDate = {
      gte: startOfDay,
      lte: endOfDay,
    };
  }
  return await client.medicalAppointment.findMany({
    where,
    include: {
      patient: true,
      doctor: true,
    },
    orderBy: { appointmentDate: 'asc' },
  });
}

export async function getAppointmentById(id: string, tenantId: string) {
  return await client.medicalAppointment.findFirst({
    where: { id, tenantId },
    include: {
      patient: true,
      doctor: true,
    },
  });
}

export async function createAppointment(
  data: Partial<MedicalAppointment> & { tenantId: string }
) {
  return await client.medicalAppointment.create({
    data: {
      patientId: data.patientId!,
      doctorId: data.doctorId!,
      appointmentDate: data.appointmentDate!,
      appointmentType: data.appointmentType || 'CONSULTATION',
      status: 'SCHEDULED',
      reason: data.reason,
      notes: data.notes,
      tenantId: data.tenantId,
    },
    include: {
      patient: true,
      doctor: true,
    },
  });
}

export async function updateAppointment(
  id: string,
  data: Partial<MedicalAppointment>,
  tenantId: string
) {
  return await client.medicalAppointment.update({
    where: { id, tenantId },
    data,
  });
}

export async function cancelAppointment(id: string, tenantId: string) {
  return { id, status: 'CANCELLED' };
}

export async function checkInAppointment(id: string, vitals: any, tenantId: string) {
  return { id, status: 'IN_PROGRESS', vitals };
}

// Medical Records
export async function getMedicalRecords(patientId: string, tenantId: string) {
  return [];
}

export async function getMedicalRecordById(id: string, tenantId: string) {
  return null;
}

export async function createMedicalRecord(
  data: Partial<MedicalRecord> & { tenantId: string }
) {
  return {
    id: `record_${Date.now()}`,
    patientId: data.patientId!,
    doctorId: data.doctorId!,
    visitDate: data.visitDate || new Date(),
    diagnosis: data.diagnosis!,
    prescription: data.prescription,
    notes: data.notes,
  };
}

// Patient History
export async function getPatientHistory(patientId: string, tenantId: string) {
  return {
    patientId,
    appointments: [],
    medicalRecords: [],
    prescriptions: [],
    labResults: [],
  };
}

// Prescription Management
export async function createPrescription(
  patientId: string,
  recordId: string,
  medications: any[],
  tenantId: string
) {
  return {
    id: `rx_${Date.now()}`,
    patientId,
    recordId,
    medications,
    prescribedDate: new Date(),
  };
}

// Lab Orders
export async function createLabOrder(
  patientId: string,
  tests: string[],
  tenantId: string
) {
  return {
    id: `lab_${Date.now()}`,
    patientId,
    tests: tests.map(test => ({
      id: `test_${Date.now()}_${Math.random()}`,
      test,
      status: 'PENDING',
    })),
    orderedDate: new Date(),
  };
}

export async function getLabResults(patientId: string, tenantId: string) {
  return [];
}

// Schedule Management
export async function getDoctorSchedule(doctorId: string, date: Date, tenantId: string) {
  return {
    doctorId,
    date,
    appointments: [],
    availableSlots: [],
  };
}

export async function getAvailableSlots(
  doctorId: string,
  date: Date,
  duration: number,
  tenantId: string
) {
  // Generate available time slots
  const slots = [];
  const start = new Date(date);
  start.setHours(9, 0, 0, 0);
  const end = new Date(date);
  end.setHours(17, 0, 0, 0);
  
  let current = new Date(start);
  while (current < end) {
    slots.push({
      time: current.toISOString(),
      available: Math.random() > 0.3,
    });
    current = new Date(current.getTime() + duration * 60000);
  }
  
  return slots;
}

// Analytics
export async function getHealthcareAnalytics(tenantId: string) {
  return {
    totalPatients: 0,
    appointmentsToday: 0,
    appointmentsThisWeek: 0,
    averageWaitTime: 0,
    patientSatisfaction: 0,
  };
}
