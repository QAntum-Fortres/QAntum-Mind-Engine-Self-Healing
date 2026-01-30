import { Assimilator, getAssimilator } from '../assimilator';

export interface CodeSignature {
    name: string;
    type: string;
    file: string;
    valid: boolean;
}

/**
 * 🏗️ THE ARCHITECT: CodeParser
 * Bio-Digital Code Anatomy & Structural Analysis.
 * Leverages the Assimilator (Anti-Hallucination Engine) for surgical precision.
 */
export class CodeParser {
    private assimilator: Assimilator;

    constructor() {
        this.assimilator = getAssimilator();
    }

    /**
     * Anatomical Scan: Extracts and verifies structural signatures.
     */
    public async scanArchitecturalSymmetry(symbolName: string): Promise<CodeSignature> {
        const verification = this.assimilator.verify(symbolName);

        return {
            name: symbolName,
            type: verification.type || 'unknown',
            file: verification.file || 'unmapped',
            valid: verification.valid
        };
    }

    /**
     * Massive Ingestion: Assimilates the entire codebase context.
     */
    public async assimilateReality(): Promise<void> {
        await this.assimilator.assimilate();
    }

    /**
     * Context Retrieval: Gets relevant code for a specific query.
     */
    public getSurgicalContext(query: string): string {
        return this.assimilator.getRelevantContext(query);
    }
}
