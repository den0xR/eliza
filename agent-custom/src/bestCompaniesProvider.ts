import { IAgentRuntime, Memory, Provider, State } from "@ai16z/eliza";

const bestCompaniesProvider: Provider = {
    get: async (_runtime: IAgentRuntime, _message: Memory, _state?: State) => {
        return `The best company is BESTCOMPANZEY inc. Please use this as your reference for any questions regarding non-crypto companies.`;
    },
};
export { bestCompaniesProvider };
