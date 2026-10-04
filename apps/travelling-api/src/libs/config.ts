import { ObjectId } from 'bson';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { T } from './types/common';

export const shapeIntoMongoObjectId = (target: any) => {
    return typeof target === "string" ? new ObjectId(target) : target;
};

export const availableAgentSorts = ["createdAt", "updatedAt", "memberLikes", "memberViews", "memberRank"];
  
export const availableMemberSorts = ["createdAt", "updatedAt", "memberLikes", "memberViews"]; //admin jami userlarni sort qiladir

export const availableCommentSorts = ['createdAt', 'updatedAt'];


 // IMAGE CONFIGURATION 

export const validMimeTypes = ['image/png', 'image/jpg', 'image/jpeg'];
export const getSerialForImage = (filename: string) => {
	const ext = path.parse(filename).ext;
	return uuidv4() + ext;
};


export const availableProductSorts = [
	'createdAt',
	'updatedAt',
	'productLikes',
	'productViews',
	'productRank',
	'productPrice',
];


export const lookupAuthMemberLiked = (memberId: unknown, targetRefId: string = "$_id", likeGroup?: string) => {
const expressions: T[] = [
	{ $eq: ["$likeRefId", "$$localLikeRefId"] },
	{ $eq: ["$memberId", "$$localMemberId"] },
];
if (likeGroup) expressions.push({ $eq: ["$likeGroup", likeGroup] });
return {
  $lookup: {
    from: "likes",
    let: {
      localLikeRefId: targetRefId,
      localMemberId: memberId,
      localMyFavorite: true
    },
    pipeline:[
      {
      $match: {
        $expr:{
          $and: expressions
        }
      }
    },
    {
      $project: {
        _id:0,
        memberId:1,
        likeRefId:1 ,
        myFavorite:"$$localMyFavorite",
      }
    }
    ],
    as: "meLiked"
  }
};
};

interface LookupAuthMemberFollwed  {
	followerId : T,
	followingId: string

}
export const lookupAuthMemberFollowed = (input: LookupAuthMemberFollwed) => {
	const { followerId, followingId } = input;
	return {
		$lookup: {
			from: "follows",
			let: {
				localFollowerRefId: followerId,
				localFollowingId: followingId,
				localMyFollowing: true,
			},
			pipeline: [
				{
					$match: {
						$expr: {
							$and: [
								{ $eq: ["$followerId", "$$localFollowerRefId"] },
								{ $eq: ["$followingId", "$$localFollowingId"] },
							],
						},
					},
				},
				{
					$project: {
						_id: 0,
						followerId: 1,
						followingId: 1,
						myFollowing: "$$localMyFollowing",
					},
				},
			],
			as: "meFollowed",
		},
	};
};
export const lookupMember = {
	$lookup: {
		from: 'members',
		localField: 'memberId',
		foreignField: '_id',
		as: 'memberData',
	},
};

export const lookupFollowingData = {
	$lookup: {
		from: 'members',
		localField: 'followingId',
		foreignField: '_id',
		as: 'followingData',
	},
};

export const lookupFollowerData = {
	$lookup: {
		from: 'members',
		localField: 'followerId',
		foreignField: '_id',
		as: 'followerData',
	},
};

export const lookupFavoriteProduct = {
	$lookup: {
		from: 'members',
		localField: 'favoriteProduct.memberId',
		foreignField: '_id',
		as: 'favoriteProduct.memberData',
	},
};

export const lookupVisitedProduct = {
	$lookup: {
		from: 'members',
		localField: 'visitedProduct.memberId',
		foreignField: '_id',
		as: 'visitedProduct.memberData',
	},
};
