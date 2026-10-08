import { Schema } from 'mongoose';

const FollowSchema = new Schema(
	{
		followingId: {
			type: Schema.Types.ObjectId,
			required: true,
		},

		followerId: {
			type: Schema.Types.ObjectId,
			required: true,
		},
	},
	{ timestamps: true , collection: "follows"},
);

FollowSchema.index({ followingId: 1, followerId: 1 }, { unique: true });
FollowSchema.index({ followerId: 1, createdAt: -1, _id: -1 });
FollowSchema.index({ followingId: 1, createdAt: -1, _id: -1 });

export default FollowSchema;
