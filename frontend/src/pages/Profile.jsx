import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const navigate = useNavigate();
  const { user, token } = useAuth(); // Sử dụng AuthContext
  const role = user?.role;
  const authHeader = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    avatar: "",
    phone: "",

    // barber fields
    experience: 0,
    specialty: "",
    workingHours: {},
    dayOff: {},
  });


  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      try {        
        const userRes = await API.get("/auth/me", authHeader);
        if (cancelled) return;

        if (role === "barber") {
          const barberRes = await API.get(`/barber/me`, authHeader);
          if (cancelled) return;

          setProfile((p) => ({
            ...p,
            name: userRes.data?.name || "",
            avatar: barberRes.data?.avatar ?? userRes.data?.avatar ?? "",
            phone: userRes.data?.phone || "",
            experience: barberRes.data?.experienceYears ?? 0,
            specialty: barberRes.data?.specialty ?? "",
            workingHours: barberRes.data?.workingHours ?? {},
            dayOff: barberRes.data?.dayOff ?? {},
          }));
        } else {
          setProfile((p) => ({
            ...p,
            name: userRes.data?.name || "",
            avatar: userRes.data?.avatar || "",
            phone: userRes.data?.phone || "",
          }));
        }
      } catch (e) {
        if (cancelled) return;
        toast.error(e?.response?.data?.msg || "Không thể tải profile");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authHeader, navigate, role, token]);


  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!token) return;

    setLoading(true);
    try {
      if (role === "barber") {
        await API.put(
          "/barber/me",
          {
            avatar: profile.avatar || "",
            experienceYears: Number(profile.experience) || 0,
            specialty: profile.specialty || "",
            workingHours: profile.workingHours || {},
            dayOff: profile.dayOff || {},
          },
          authHeader
        );
      } else {
        await API.put(
          "/auth/me",
          {
            name: profile.name || "",
            avatar: profile.avatar || "",
            phone: profile.phone || "",
          },
          authHeader
        );
      }
      toast.success("Cập nhật profile thành công");
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Cập nhật thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      toast.error("Mật khẩu mới phải ít nhất 6 ký tự");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    setLoading(true);
    try {
      await API.put(
        "/auth/change-password",
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        },
        authHeader
      );
      toast.success("Đổi mật khẩu thành công");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Đổi mật khẩu thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
          <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 text-center mb-10">Profile</h1>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-6">Thông tin cá nhân</h2>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                  {profile.avatar ? (
                    <img src={profile.avatar} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-400">👤</span>
                  )}
                </div>
                <div>
                  <div className="font-bold text-gray-900">{profile.name || ""}</div>
                  <div className="text-sm text-gray-500">Họ tên</div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Avatar (URL)</label>
                <input
                  className="w-full border p-2 rounded bg-white text-gray-900"
                  value={profile.avatar}
                  onChange={(e) => setProfile((p) => ({ ...p, avatar: e.target.value }))}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Phone</label>
                <input
                  className="w-full border p-2 rounded bg-white text-gray-900"
                  value={profile.phone}
                  onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="Số điện thoại"
                />
              </div>

              {role === "barber" && (
                <div className="space-y-4 pt-3 border-t">
                  <h3 className="text-lg font-bold">Barber profile</h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Experience (năm)</label>
                      <input
                        type="number"
                        min={0}
                        className="w-full border p-2 rounded bg-white text-gray-900"
                        value={profile.experience ?? 0}
                        onChange={(e) => setProfile((p) => ({ ...p, experience: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Specialty</label>
                      <input
                        className="w-full border p-2 rounded bg-white text-gray-900"
                        value={profile.specialty ?? ""}
                        onChange={(e) => setProfile((p) => ({ ...p, specialty: e.target.value }))}
                        placeholder="Ví dụ: Fade & Undercut"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="text-sm text-gray-600 font-semibold">Availability (workingHours + dayOff)</div>

                    {/* working hours editor: simple single range per day */}
                    {(['mon','tue','wed','thu','fri','sat','sun']).map((dayKey) => {
                      const dayOff = Boolean(profile.dayOff?.[dayKey]);
                      const range = (profile.workingHours?.[dayKey]?.[0]) || { start: '09:00', end: '17:00' };
                      return (
                        <div key={dayKey} className="grid grid-cols-1 sm:grid-cols-6 gap-2 items-center">
                          <div className="capitalize font-bold text-sm text-gray-800">{dayKey}</div>

                          <label className="flex items-center gap-2 text-sm sm:col-span-2">
                            <input
                              type="checkbox"
                              checked={dayOff}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setProfile((p) => ({
                                  ...p,
                                  dayOff: { ...(p.dayOff || {}), [dayKey]: checked },
                                  workingHours: checked
                                    ? { ...(p.workingHours || {}), [dayKey]: [] }
                                    : (p.workingHours || {}),
                                }));
                              }}
                            />
                            Nghỉ
                          </label>

                          <div className="sm:col-span-3 grid grid-cols-2 gap-2">
                            <input
                              type="time"
                              disabled={dayOff}
                              className="border p-2 rounded bg-white text-gray-900 disabled:opacity-50"
                              value={range.start}
                              onChange={(e) => {
                                const val = e.target.value;
                                setProfile((p) => {
                                  const wh = { ...(p.workingHours || {}) };
                                  const cur = (wh[dayKey]?.[0]) || { start: '09:00', end: '17:00' };
                                  wh[dayKey] = [{ start: val, end: cur.end }];
                                  return { ...p, workingHours: wh };
                                });
                              }}
                            />
                            <input
                              type="time"
                              disabled={dayOff}
                              className="border p-2 rounded bg-white text-gray-900 disabled:opacity-50"
                              value={range.end}
                              onChange={(e) => {
                                const val = e.target.value;
                                setProfile((p) => {
                                  const wh = { ...(p.workingHours || {}) };
                                  const cur = (wh[dayKey]?.[0]) || { start: '09:00', end: '17:00' };
                                  wh[dayKey] = [{ start: cur.start, end: val }];
                                  return { ...p, workingHours: wh };
                                });
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 rounded-xl font-bold disabled:opacity-50"
              >
                {loading ? "Đang xử lý..." : "Lưu thay đổi"}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-6">Đổi mật khẩu</h2>

            <form onSubmit={handleChangePassword} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  className="w-full border p-2 rounded bg-white text-gray-900"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Mật khẩu mới</label>
                <input
                  type="password"
                  className="w-full border p-2 rounded bg-white text-gray-900"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  className="w-full border p-2 rounded bg-white text-gray-900"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold disabled:opacity-50"
              >
                {loading ? "Đang xử lý..." : "Đổi mật khẩu"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
