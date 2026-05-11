import Notification from "../models/notification.model.js";

function getReceiverQuery(req) {
  return {
    receiverId: req.user.id,
    receiverRole: req.user.role,
  };
}

export async function getNotifications(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit || "20", 10), 50);

    const query = getReceiverQuery(req);
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);

    const unreadCount = await Notification.countDocuments({
      ...query,
      isRead: false,
    });

    res.json({ notifications, unreadCount });
  } catch (err) {
    console.error("getNotifications error:", err);
    res.status(500).json({ msg: "Server error" });
  }
}

export async function markAsRead(req, res) {
  try {
    const { id } = req.params;
    const query = getReceiverQuery(req);

    const notif = await Notification.findOne({ ...query, _id: id });
    if (!notif) return res.status(404).json({ msg: "Not found" });

    if (!notif.isRead) {
      notif.isRead = true;
      await notif.save();
    }

    res.json({ msg: "Marked as read" });
  } catch (err) {
    console.error("markAsRead error:", err);
    res.status(500).json({ msg: "Server error" });
  }
}

export async function markAllAsRead(req, res) {
  try {
    const query = getReceiverQuery(req);

    await Notification.updateMany({ ...query, isRead: false }, { $set: { isRead: true } });

    const unreadCount = await Notification.countDocuments({
      ...query,
      isRead: false,
    });

    res.json({ msg: "Marked all as read", unreadCount });
  } catch (err) {
    console.error("markAllAsRead error:", err);
    res.status(500).json({ msg: "Server error" });
  }
}

