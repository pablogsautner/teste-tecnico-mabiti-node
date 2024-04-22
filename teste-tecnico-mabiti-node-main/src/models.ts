import 'reflect-metadata';
import * as mongoose from 'mongoose';
import { TimeStamps, Base } from '@typegoose/typegoose/lib/defaultClasses';
import { pre, getModelForClass, Prop, Ref, modelOptions } from '@typegoose/typegoose';
import lib from './lib';

class EnhancedBase extends TimeStamps {
    @Prop({ type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() })
    _id!: mongoose.Types.ObjectId;
}

@pre<User>('save', async function (next) {
    const user = this as Omit<any, keyof User> & User;

    if (user.isModified('coordinates')) {
        user.address = await lib.getAddressFromCoordinates(user.coordinates);
    } else if (user.isModified('address')) {
        const { lat, lng } = await lib.getCoordinatesFromAddress(user.address);
        user.coordinates = [lng, lat];
    }

    next();
})
export class User extends EnhancedBase {
    @Prop({ required: true, type: String })
    name: string;

    @Prop({ required: true, type: String })
    email: string;

    @Prop({ required: true, type: String })
    address: string;

    @Prop({ required: true, type: [Number] })
    coordinates: [number, number];

    @Prop({ required: true, default: [], ref: 'Region' })
    regions: Ref<Region>[];

    constructor(name: string, email: string, address: string, coordinates: [number, number], regions: Ref<Region>[]){
        super()
        this.name = name;
        this.email = email;
        this.address = address;
        this.coordinates = coordinates;
        this.regions = regions;
    }
}

@pre<Region>('save', async function (next) {
    const region = this as Omit<any, keyof Region> & Region;

    if (region.isNew) {
        const user = await UserModel.findOne({ _id: region.user });
        if (user) {
            user.regions.push(region._id);
            await user.save({ session: region.$session() });
        }
    }

    next(region.validateSync());
})
@modelOptions({ schemaOptions: { validateBeforeSave: false } })
export class Region extends EnhancedBase {
    @Prop({ required: true, type: String })
    name: string;

    @Prop({ ref: 'User', required: true, type: mongoose.Schema.Types.ObjectId })
    user: Ref<User>;

    constructor(name: string, user: Ref<User>){
        super()
        this.name = name;
        this.user = user;
    }
}

export const UserModel = getModelForClass(User);
export const RegionModel = getModelForClass(Region);