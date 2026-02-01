
import {
    CompiledModule, CompiledFunction, Instruction, OpCode, Value, Upvalue
} from './bytecode.js';

// Constant tags
const TAG_NONE = 0;
const TAG_INT = 1;
const TAG_FLOAT = 2;
const TAG_STRING = 3;
const TAG_BOOL = 4;
// We only serialize primitive constants in the pool usually

export class Serializer {
    private buffer: Buffer;
    private offset: number;

    constructor() {
        this.buffer = Buffer.alloc(1024);
        this.offset = 0;
    }

    private ensureCapacity(size: number) {
        if (this.offset + size > this.buffer.length) {
            const newSize = Math.max(this.buffer.length * 2, this.offset + size);
            const newBuffer = Buffer.alloc(newSize);
            this.buffer.copy(newBuffer);
            this.buffer = newBuffer;
        }
    }

    private writeByte(val: number) {
        this.ensureCapacity(1);
        this.buffer.writeUInt8(val, this.offset);
        this.offset += 1;
    }

    private writeUInt16(val: number) {
        this.ensureCapacity(2);
        this.buffer.writeUInt16LE(val, this.offset);
        this.offset += 2;
    }

    private writeUInt32(val: number) {
        this.ensureCapacity(4);
        this.buffer.writeUInt32LE(val, this.offset);
        this.offset += 4;
    }

    private writeDouble(val: number) {
        this.ensureCapacity(8);
        this.buffer.writeDoubleLE(val, this.offset);
        this.offset += 8;
    }

    private writeString(str: string) {
        const strBuf = Buffer.from(str, 'utf-8');
        this.writeUInt32(strBuf.length);
        this.ensureCapacity(strBuf.length);
        strBuf.copy(this.buffer, this.offset);
        this.offset += strBuf.length;
    }

    private writeInstruction(inst: Instruction) {
        this.writeByte(inst.op);
        // Determine if we write an argument based on OpCode or just always write it if present?
        // For simplicity, let's look at arg.
        // Ideally, we know which opcodes take args.
        // But for a simple format, we can use a flag or just always write 4 bytes if uncertain.
        // Optimally: look at OpCode. But here we can just write it.
        // Let's assume all ops *might* have an arg, if undefined use 0? 
        // Wait, some ops use 0 as valid arg.
        // Let's rely on the definition.
        this.writeUInt32(inst.arg ?? 0);
    }

    private writeValue(val: Value) {
        switch (val.type) {
            case 'none':
                this.writeByte(TAG_NONE);
                break;
            case 'int':
                this.writeByte(TAG_INT);
                this.writeDouble(val.value); // JS numbers are doubles, simplified
                break;
            case 'float':
                this.writeByte(TAG_FLOAT);
                this.writeDouble(val.value);
                break;
            case 'string':
                this.writeByte(TAG_STRING);
                this.writeString(val.value);
                break;
            case 'bool':
                this.writeByte(TAG_BOOL);
                this.writeByte(val.value ? 1 : 0);
                break;
            case 'function': {
                const fnVal = val.value;
                if ('code' in fnVal) {
                    this.writeByte(5); // TAG_FUNCTION
                    this.writeFunction(fnVal as CompiledFunction);
                } else {
                    throw new Error("Builtin functions cannot be serialized in constant pool");
                }
                break;
            }
            case 'class': {
                const classDef = val.value;
                this.writeByte(6); // TAG_CLASS
                this.writeString(classDef.name);

                // Fields
                this.writeUInt32(classDef.fields.length);
                for (const f of classDef.fields) {
                    this.writeString(f);
                }

                // Methods
                this.writeUInt32(classDef.methods.size);
                for (const [name, fn] of classDef.methods) {
                    this.writeString(name);
                    this.writeFunction(fn);
                }
                break;
            }
            default:
                throw new Error(`Unsupported constant type: ${val.type}`);
        }
    }

    private writeFunction(fn: CompiledFunction) {
        this.writeString(fn.name);
        this.writeUInt32(fn.arity);
        this.writeUInt32(fn.localCount);

        // Upvalues
        this.writeUInt32(fn.upvalues.length);
        for (const up of fn.upvalues) {
            this.writeByte(up.isLocal ? 1 : 0);
            this.writeUInt32(up.index);
        }

        // Code
        this.writeUInt32(fn.code.length);
        for (const inst of fn.code) {
            this.writeInstruction(inst);
        }
    }

    public serialize(module: CompiledModule): Buffer {
        // Magic "UABC"
        this.writeString("UABC");
        // Version
        this.writeUInt16(1);

        // Constants
        this.writeUInt32(module.constants.length);
        for (const c of module.constants) {
            this.writeValue(c);
        }

        // Globals (names)
        this.writeUInt32(module.globals.length);
        for (const g of module.globals) {
            this.writeString(g);
        }

        // Functions
        this.writeUInt32(module.functions.length);
        for (const fn of module.functions) {
            this.writeFunction(fn);
        }

        // Main Code
        this.writeUInt32(module.mainCode.length);
        for (const inst of module.mainCode) {
            this.writeInstruction(inst);
        }

        return this.buffer.subarray(0, this.offset);
    }
}
