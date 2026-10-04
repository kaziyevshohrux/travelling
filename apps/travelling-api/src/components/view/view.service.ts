import { InjectModel } from '@nestjs/mongoose';

import { Injectable } from '@nestjs/common';
import { ViewInput } from '../../libs/dto/view/view.input';
import { View } from '../../libs/dto/view/view';
import { Model, ObjectId } from 'mongoose';
import { T } from '../../libs/types/common';
import { OrdinaryInquiry } from '../../libs/dto/property/property.input';
import { Properties } from '../../libs/dto/property/property';
import { lookupVisited } from '../../libs/config';
import { ViewGroup } from '../../libs/enums/view.enum';


@Injectable()
export class ViewService {
    constructor(@InjectModel("View") private readonly viewModel: Model<View>){}

    public async recordView(input: ViewInput): Promise<View | null>{
        const viewExist = await this.checkViewExtence(input);
        if(!viewExist) {
            console.log("-New View Insert-");
            return await this.viewModel.create(input)
        }
       return null;
    }

    private async checkViewExtence(input: ViewInput): Promise<View | null>{ //privatega sabab bu method faqat shu klass ichida ishga tushadi
        const {memberId, viewRefId} = input;
        const search: T = {memberId: memberId, viewRefId: viewRefId}
        return await this.viewModel.findOne(search).exec();
    }


    public async getVisitedProperties(memberId: ObjectId, input: OrdinaryInquiry): Promise<Properties>{
            const { page , limit} = input
            const match : T = {viewGroup: ViewGroup.PROPERTY , memberId: memberId}
            const data:T = await this.viewModel.aggregate([
                {$match: match},
                {$sort: {updateAt: -1}},
                {
                    $lookup: {
                        from: "properties",
                        localField: "viewRefId",
                        foreignField:"_id",
                        as: "visitedProperty",
    
                    },
                },
                {$unwind: "$visitedProperty"},
                {
                    $facet:{
                        list: [
                             {$skip: (page-1) *limit},
                             {$limit: limit},lookupVisited,
                             {$unwind: "$visitedProperty"}, 
                        ],
                        metaCounter: [{$count: "total"}],
                    },
                },
                
            ])
            .exec()
            const result : Properties = { list:[], metaCounter: data[0].metaCounter}
            result.list = data[0].list.map((ele) => ele.visitedProperty)
            return result
        }
}