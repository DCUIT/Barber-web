import API from "../api";

const notificationService = {
  async getNotifications() {
    const res = await API.get("/notifications?limit=20");
    return res.data;
  },

  async markAllAsRead() {
    const res = await API.patch("/notifications/read-all");
    return res.data;
  },

  async markAsRead(id) {
    const res = await API.patch(`/notifications/${id}/read`);
    return res.data;
  },
};

export default notificationService;

