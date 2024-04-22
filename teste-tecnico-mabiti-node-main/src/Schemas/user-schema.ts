import mongoose from 'mongoose';
import { z } from 'zod';

const { Schema } = mongoose;

const userSchema = new Schema({
    name: String,
    email: String,
    address: String,
    coordinates:[Number, Number]
});

export { userSchema };