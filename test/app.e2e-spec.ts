import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
// import { PrismaService } from '../src/prisma/prisma.service';
import * as pactum from 'pactum';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../src/auth/auth.service';
import { OrganizationService } from '../src/organization/organization.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { like } from 'pactum-matchers';

describe('Test', () => {
  let app: INestApplication;
  let jwt: JwtService;
  let auth: AuthService;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        OrganizationService,
        {
          provide: PrismaService,
          useValue: {
            userOrganization: {
              findFirst: jest.fn(),
            },
            organization: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );

    await app.init();
    app.listen(3000);
    jwt = app.get(JwtService);
    auth = app.get(AuthService);
    pactum.request.setBaseUrl('http://localhost:3000');
    const user = {
      userId: 'clybgg4a00000gk3dr4emyrgn',
      email: 'mercy@gmail.com',
    };
    const signInResponse = await auth.signToken(user.userId, user.email);
    const token = signInResponse.access_token;
    pactum.request.setDefaultHeaders({
      Authorization: `Bearer ${token}`,
    });
    // await prisma.cleanDb();
  });

  afterAll(() => {
    app.close();
  });

  it('should ensure token expires at correct time and correct user detail is found in token', async () => {
    const user = { userId: 'dhfd939', email: 'henry@gmail.com' };
    const token = await auth.signToken(user.userId, user.email);

    expect(token).toHaveProperty('access_token');

    const decodedToken = jwt.decode(token.access_token) as any;

    const currentTimestamp = Math.floor(Date.now() / 1000);
    const expectedExpiry = currentTimestamp + 3600;
    const actualExpiry = decodedToken.exp;

    expect(Math.abs(expectedExpiry - actualExpiry)).toBeLessThan(5);
  });

  it('users can’t see data from organisations they don’t have access to.', async () => {
    const orgId = 'clybbtifa0000gz3or8qof44z';

    await pactum.spec().get(`/api/organizations/${orgId}`).expectStatus(404);
  });

  describe('Register endpoint', () => {
    it('should register user successfully', () => {
      const user = {
        firstName: 'Angel',
        lastName: 'Benita',
        email: 'angel@gmail.com',
        password: 'benita123',
        phone: '07052899465',
      };

      pactum
        .spec()
        .withBody(user)
        .post('/auth/signup')
        .expectStatus(201)
        .expectJson({
          status: 'success',
          message: 'Login successful',
          accessToken: like('eyJ...'),
          data: user,
        });
    });

    it('should log in user succesfully', () => {
      const loginDetail = {
        email: 'angel@gmail.com',
        password: 'benita123',
      };

      const user = {
        firstName: 'Angel',
        lastName: 'Benita',
        email: 'angel@gmail.com',
        password: 'benita123',
        phone: '07052899465',
      };

      pactum
        .spec()
        .withBody(loginDetail)
        .post('/auth/login')
        .expectStatus(201)
        .expectJson({
          status: 'success',
          message: 'Login successful',
          accessToken: like('eyJ...'),
          data: user,
        });
    });

    it('should failed for empty first name', () => {
      const user = {
        firstName: '',
        lastName: 'Benita',
        email: 'angel@gmail.com',
        password: 'benita123',
        phone: '07052899465',
      };

      pactum.spec().withBody(user).post('/auth/signup').expectStatus(422);
    });

    it('should failed for empty last name', () => {
      const user = {
        firstName: 'Angel',
        lastName: '',
        email: 'angel@gmail.com',
        password: 'benita123',
        phone: '07052899465',
      };

      pactum.spec().withBody(user).post('/auth/signup').expectStatus(422);
    });

    it('should failed for empty email', () => {
      const user = {
        firstName: 'Angel',
        lastName: 'Benita',
        email: '',
        password: 'benita123',
        phone: '07052899465',
      };

      pactum.spec().withBody(user).post('/auth/signup').expectStatus(422);
    });

    it('should failed for empty password', () => {
      const user = {
        firstName: 'Angel',
        lastName: 'Benita',
        email: 'angel@gmail.com',
        password: '',
        phone: '07052899465',
      };

      pactum.spec().withBody(user).post('/auth/signup').expectStatus(422);
    });

    it('should fail if there is duplicate email or userId', () => {
      const user = {
        firstName: 'Angel',
        lastName: 'Benita',
        email: 'angel@gmail.com',
        password: 'benita123',
        phone: '07052899465',
      };

      pactum.spec().withBody(user).post('/auth/signup').expectStatus(422);
    });
  });
});
