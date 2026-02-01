
import {
    CompiledModule, CompiledFunction, Instruction, OpCode, Value, Upvalue, Val
} from './bytecode.js';

// Constant tags matching serializer
const TAG_NONE = 0;
const TAG_INT = 1;
const TAG_FLOAT = 2;
const TAG_STRING = 3;
const TAG_BOOL = 4;
const TAG_FUNCTION = 5;
const TAG_CLASS = 6;

export class Deserializer {
    private buffer: Buffer;
    private offset: number;

    constructor(buffer: Buffer) {
        this.buffer = buffer;
        this.offset = 0;
    }

    private readByte(): number {
        const val = this.buffer.readUInt8(this.offset);
        this.offset += 1;
        return val;
    }

    private readUInt16(): number {
        const val = this.buffer.readUInt16LE(this.offset);
        this.offset += 2;
        return val;
    }

    private readUInt32(): number {
        const val = this.buffer.readUInt32LE(this.offset);
        this.offset += 4;
        return val;
    }

    private readDouble(): number {
        const val = this.buffer.readDoubleLE(this.offset);
        this.offset += 8;
        return val;
    }

    private readString(): string {
        const len = this.readUInt32();
        const str = this.buffer.toString('utf-8', this.offset, this.offset + len);
        this.offset += len;
        return str;
    }

    private readInstruction(): Instruction {
        const op = this.readByte() as OpCode;
        const arg = this.readUInt32();
        return { op, arg };
    }

    private readValue(): Value {
        const tag = this.readByte();
        switch (tag) {
            case TAG_NONE:
                return Val.none();
            case TAG_INT:
                return Val.int(this.readDouble());
            case TAG_FLOAT:
                return Val.float(this.readDouble());
            case TAG_STRING:
                return Val.string(this.readString());
            case TAG_BOOL:
                return Val.bool(this.readByte() !== 0);
            case TAG_FUNCTION:
                return { type: 'function', value: this.readFunction() };
            case TAG_CLASS: {
                const name = this.readString();
                const fieldCount = this.readUInt32();
                const fields: string[] = [];
                for (let i = 0; i < fieldCount; i++) {
                    fields.push(this.readString());
                }

                const methodCount = this.readUInt32();
                const methods = new Map<string, CompiledFunction>();
                for (let i = 0; i < methodCount; i++) {
                    const mName = this.readString();
                    const mFn = this.readFunction();
                    methods.set(mName, mFn);
                }

                return { type: 'class', value: { name, fields, methods } };
            }
            default:
                throw new Error(`Unknown value tag: ${tag}`);
        }
    }

    private readFunction(): CompiledFunction {
        const name = this.readString();
        const arity = this.readUInt32();
        const localCount = this.readUInt32();

        const upvalueCount = this.readUInt32();
        const upvalues: Upvalue[] = [];
        for (let i = 0; i < upvalueCount; i++) {
            const isLocal = this.readByte() !== 0;
            const index = this.readUInt32();
            upvalues.push({ isLocal, index });
        }

        const codeLen = this.readUInt32();
        const code: Instruction[] = [];
        for (let i = 0; i < codeLen; i++) {
            code.push(this.readInstruction());
        }

        return {
            name,
            arity,
            localCount,
            upvalueCount,
            upvalues,
            code
        };
    }

    public deserialize(): CompiledModule {
        // Magic "UABC"
        const magic = this.readString();
        if (magic !== "UABC") {
            throw new Error("Invalid bytecode file format");
        }

        // Version
        const version = this.readUInt16(); // 1

        // Constants
        const constLen = this.readUInt32();
        const constants: Value[] = [];
        for (let i = 0; i < constLen; i++) {
            constants.push(this.readValue());
        }

        // Globals
        const globalLen = this.readUInt32();
        const globals: string[] = [];
        for (let i = 0; i < globalLen; i++) {
            globals.push(this.readString());
        }

        // Functions
        const funcLen = this.readUInt32();
        const functions: CompiledFunction[] = [];
        for (let i = 0; i < funcLen; i++) {
            functions.push(this.readFunction());
        }

        // Main Code
        const mainLen = this.readUInt32();
        const mainCode: Instruction[] = [];
        for (let i = 0; i < mainLen; i++) {
            mainCode.push(this.readInstruction());
        }

        return {
            constants,
            globals,
            functions,
            mainCode
        };
    }
}
