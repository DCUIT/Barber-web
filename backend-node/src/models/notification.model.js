import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    receiverRole: {
      type: String,
      enum: ["user", "barber", "admin"],
      required: true,
    },
    title: {
      type: String,
      default: "",
    },
    message: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      default: "booking",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Notification", notificationSchema);

