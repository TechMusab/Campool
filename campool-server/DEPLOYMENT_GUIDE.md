# 🚀 AWS Deployment Guide for Campool Backend

## Prerequisites
- AWS Account
- AWS CLI installed
- Docker installed (optional)
- Domain name (optional)

## Option 1: AWS EC2 Deployment

### Step 1: Launch EC2 Instance
1. Go to AWS Console → EC2
2. Launch Instance with:
   - **AMI**: Ubuntu Server 20.04 LTS
   - **Instance Type**: t3.micro (free tier) or t3.small
   - **Security Group**: Create new with ports 22 (SSH), 80 (HTTP), 443 (HTTPS), 4000 (App)
   - **Key Pair**: Create or use existing

### Step 2: Connect to EC2
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

### Step 3: Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y

# Install MongoDB (or use MongoDB Atlas)
sudo apt install mongodb -y
```

### Step 4: Deploy Your App
```bash
# Clone your repository
git clone https://github.com/yourusername/campool-server.git
cd campool-server

# Install dependencies
npm install

# Create production environment file
sudo nano .env.production
```

### Step 5: Environment Configuration
```env
# MongoDB Connection
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/campool?retryWrites=true&w=majority

# Server Configuration
PORT=4000
NODE_ENV=production

# JWT Secret
JWT_SECRET=your-super-secure-jwt-secret-key-for-production

# SMTP Configuration (AWS SES)
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password
MAIL_FROM=noreply@yourdomain.com

# CORS Configuration
CORS_ORIGIN=https://your-frontend-domain.com
```

### Step 6: Start Application with PM2
```bash
# Start with PM2
pm2 start src/index.js --name "campool-api"

# Save PM2 configuration
pm2 save
pm2 startup

# Check status
pm2 status
```

### Step 7: Configure Nginx (Reverse Proxy)
```bash
sudo nano /etc/nginx/sites-available/campool-api
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/campool-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Option 2: AWS Elastic Beanstalk (Easier)

### Step 1: Prepare Application
```bash
# Create .ebextensions folder
mkdir .ebextensions

# Create Node.js configuration
nano .ebextensions/nodejs.config
```

```yaml
option_settings:
  aws:elasticbeanstalk:container:nodejs:
    NodeCommand: "npm start"
    NodeVersion: 18.x
  aws:elasticbeanstalk:application:environment:
    NODE_ENV: production
    PORT: 4000
```

### Step 2: Deploy with EB CLI
```bash
# Install EB CLI
pip install awsebcli

# Initialize EB
eb init

# Create environment
eb create campool-api

# Deploy
eb deploy
```

## Option 3: AWS ECS with Docker

### Step 1: Build Docker Image
```bash
# Build image
docker build -t campool-api .

# Tag for ECR
docker tag campool-api:latest your-account.dkr.ecr.region.amazonaws.com/campool-api:latest
```

### Step 2: Push to ECR
```bash
# Create ECR repository
aws ecr create-repository --repository-name campool-api

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin your-account.dkr.ecr.us-east-1.amazonaws.com

# Push image
docker push your-account.dkr.ecr.us-east-1.amazonaws.com/campool-api:latest
```

### Step 3: Create ECS Task Definition
```json
{
  "family": "campool-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "campool-api",
      "image": "your-account.dkr.ecr.us-east-1.amazonaws.com/campool-api:latest",
      "portMappings": [
        {
          "containerPort": 4000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "MONGO_URI",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:campool/mongo-uri"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/campool-api",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

## Database Setup

### MongoDB Atlas (Recommended)
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create free cluster
3. Get connection string
4. Update MONGO_URI in environment

### AWS DocumentDB (Alternative)
```bash
# Create DocumentDB cluster
aws docdb create-db-cluster \
  --db-cluster-identifier campool-cluster \
  --engine docdb \
  --master-username admin \
  --master-user-password your-password
```

## Email Setup (AWS SES)

### Step 1: Verify Domain
```bash
# Verify domain in SES
aws ses verify-domain-identity --domain yourdomain.com
```

### Step 2: Create SMTP Credentials
```bash
# Create SMTP user
aws iam create-user --user-name ses-smtp-user

# Attach policy
aws iam attach-user-policy --user-name ses-smtp-user --policy-arn arn:aws:iam::aws:policy/AmazonSESFullAccess
```

## SSL Certificate (HTTPS)

### Using AWS Certificate Manager
```bash
# Request certificate
aws acm request-certificate \
  --domain-name yourdomain.com \
  --validation-method DNS
```

## Monitoring and Logging

### CloudWatch Setup
```bash
# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i amazon-cloudwatch-agent.deb
```

### Health Checks
```bash
# Add health check endpoint
curl -f http://localhost:4000/health || exit 1
```

## Cost Optimization

### Free Tier Usage
- EC2 t3.micro: 750 hours/month
- RDS db.t3.micro: 750 hours/month
- S3: 5GB storage
- CloudWatch: 10 custom metrics

### Estimated Monthly Cost
- EC2 t3.micro: $0 (free tier)
- RDS db.t3.micro: $0 (free tier)
- Data transfer: ~$5-10
- **Total: ~$5-10/month**

## Security Best Practices

1. **Use Security Groups** - Restrict access
2. **Enable VPC** - Isolate resources
3. **Use IAM Roles** - Least privilege access
4. **Enable CloudTrail** - Audit logging
5. **Use Secrets Manager** - Store sensitive data
6. **Enable WAF** - Web application firewall

## Backup Strategy

```bash
# Automated backups
# MongoDB Atlas provides automatic backups
# Or use AWS Backup service
```

## Scaling Strategy

### Horizontal Scaling
- Use Application Load Balancer
- Multiple EC2 instances
- Auto Scaling Groups

### Vertical Scaling
- Upgrade instance types
- Increase memory/CPU

## Monitoring

### CloudWatch Metrics
- CPU utilization
- Memory usage
- Network I/O
- Custom application metrics

### Alarms
```bash
# Create CloudWatch alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "High CPU Usage" \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold
```

## Troubleshooting

### Common Issues
1. **Port not accessible** - Check security groups
2. **Database connection failed** - Check MongoDB URI
3. **SSL certificate issues** - Verify domain ownership
4. **High costs** - Check resource usage

### Logs
```bash
# PM2 logs
pm2 logs campool-api

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -u nginx
```

## Next Steps

1. **Set up CI/CD** with GitHub Actions
2. **Implement monitoring** with CloudWatch
3. **Add backup strategy** for database
4. **Set up staging environment**
5. **Implement blue-green deployment**

## Support

- AWS Documentation: https://docs.aws.amazon.com/
- MongoDB Atlas: https://docs.atlas.mongodb.com/
- Node.js Best Practices: https://github.com/goldbergyoni/nodebestpractices
