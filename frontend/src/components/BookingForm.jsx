import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Calendar from './Calendar';

// Schema matches backend requirements in bookings.routes.js
const bookingSchema = z.object({
  barberId: z.string().min(1, 'Vui lòng chọn Barber'),
  serviceId: z.string().min(1, 'Vui lòng chọn dịch vụ'),
  bookingDate: z.string().refine((date) => {
    const today = new Date().toISOString().split('T')[0];
    return date >= today;
  }, 'Ngày đặt lịch không thể ở quá khứ'),
  bookingTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Giờ không hợp lệ (HH:mm)'),
  note: z.string().optional(),
});

const BookingForm = ({ barbers, services, onSubmitBooking }) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      note: '',
    }
  });

  const selectedBarber = watch('barberId');
  const selectedDate = watch('bookingDate');
  const selectedTime = watch('bookingTime');

  const handleSlotSelect = (date, time) => {
    setValue('bookingDate', date, { shouldValidate: true });
    setValue('bookingTime', time, { shouldValidate: true });
  };

  const onFormSubmit = async (data) => {
    try {
      await onSubmitBooking(data);
    } catch (err) {
      console.error('Submit error:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 p-4 bg-white rounded shadow">
      <div>
        <label className="block text-sm font-medium text-gray-700">Chọn Barber</label>
        <select {...register('barberId')} className="mt-1 block w-full border rounded-md p-2">
          <option value="">-- Chọn Barber --</option>
          {barbers.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
        </select>
        {errors.barberId && <p className="text-red-500 text-xs mt-1">{errors.barberId.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Chọn dịch vụ</label>
        <select {...register('serviceId')} className="mt-1 block w-full border rounded-md p-2">
          <option value="">-- Chọn dịch vụ --</option>
          {services.map(s => <option key={s._id} value={s._id}>{s.name} - {s.price}đ</option>)}
        </select>
        {errors.serviceId && <p className="text-red-500 text-xs mt-1">{errors.serviceId.message}</p>}
      </div>

      {selectedBarber && (
        <div className="border-t dark:border-gray-700 pt-4">
          <Calendar 
            barberId={selectedBarber} 
            onSelectSlot={handleSlotSelect} 
          />
          <div className="mt-2 flex gap-4 text-sm font-semibold">
             {selectedDate && <span className="text-green-600">📅 Ngày: {selectedDate}</span>}
             {selectedTime && <span className="text-green-600">⏰ Giờ: {selectedTime}</span>}
          </div>
          {errors.bookingDate && <p className="text-red-500 text-xs mt-1">{errors.bookingDate.message}</p>}
          {errors.bookingTime && <p className="text-red-500 text-xs mt-1">{errors.bookingTime.message}</p>}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">Ghi chú (Tùy chọn)</label>
        <textarea 
          {...register('note')} 
          className="mt-1 block w-full border rounded-md p-2" 
          placeholder="Ví dụ: Tôi muốn cắt kiểu Fade..."
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? 'Đang xử lý...' : 'Xác nhận đặt lịch'}
      </button>
    </form>
  );
};

export default BookingForm;