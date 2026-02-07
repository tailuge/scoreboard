import { withSwagger } from 'next-swagger-doc';
import { swaggerConfig } from '@/lib/swagger';

const swaggerHandler = withSwagger(swaggerConfig);

export default swaggerHandler();
