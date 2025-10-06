# Contributing to BullPawn

Thank you for your interest in contributing to BullPawn! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Git
- Basic knowledge of React, TypeScript, and Solidity

### Development Setup
1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/bullpawn.git`
3. Install dependencies: `npm install`
4. Copy environment file: `cp env.example .env`
5. Start development environment: `docker-compose up --build`

## 📋 Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow existing code patterns and conventions
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

### Smart Contracts
- Follow Solidity best practices
- Use OpenZeppelin libraries when possible
- Add comprehensive error messages
- Include events for important state changes
- Write tests for all new functionality

### Frontend
- Use Material-UI components consistently
- Follow React best practices
- Use TypeScript interfaces for type safety
- Implement proper error handling
- Add loading states for async operations

### Backend
- Use proper HTTP status codes
- Implement input validation
- Add comprehensive error handling
- Use TypeScript for type safety
- Follow REST API conventions

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:contracts
npm run test:backend
npm run test:frontend
```

### Test Coverage
- Aim for >80% test coverage
- Test both success and error cases
- Include integration tests for critical paths
- Test oracle integration thoroughly

## 📝 Pull Request Process

### Before Submitting
1. Ensure all tests pass
2. Update documentation if needed
3. Add/update tests for new features
4. Check code style and formatting
5. Test on zkSync Sepolia testnet

### PR Description
Include the following in your PR:
- Clear description of changes
- Screenshots for UI changes
- Test results
- Any breaking changes
- Related issues

### Review Process
- All PRs require at least one review
- Address all review comments
- Ensure CI/CD checks pass
- Maintain clean commit history

## 🐛 Bug Reports

### Before Reporting
1. Check existing issues
2. Test on latest version
3. Try to reproduce the issue
4. Check logs for error messages

### Bug Report Template
```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g. macOS, Windows, Linux]
- Browser: [e.g. Chrome, Firefox, Safari]
- Version: [e.g. 1.0.0]

**Additional context**
Any other context about the problem.
```

## 💡 Feature Requests

### Before Requesting
1. Check existing feature requests
2. Consider if it aligns with project goals
3. Think about implementation complexity
4. Consider security implications

### Feature Request Template
```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Alternative solutions or features you've considered.

**Additional context**
Any other context or screenshots about the feature request.
```

## 🔒 Security

### Security Issues
If you discover a security vulnerability, please:
1. **DO NOT** open a public issue
2. Email security details to: security@bullpawn.com
3. Include steps to reproduce
4. Wait for response before disclosure

### Security Best Practices
- Never commit private keys or secrets
- Use environment variables for sensitive data
- Validate all inputs
- Follow secure coding practices
- Keep dependencies updated

## 📚 Documentation

### Documentation Types
- **README.md**: Project overview and setup
- **API Documentation**: Backend endpoints
- **Smart Contract Docs**: Contract interfaces
- **Deployment Guide**: Production deployment
- **Contributing Guide**: This file

### Documentation Standards
- Use clear, concise language
- Include code examples
- Keep documentation up to date
- Use proper markdown formatting
- Add diagrams for complex concepts

## 🏷️ Release Process

### Version Numbering
We use [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist
- [ ] All tests pass
- [ ] Documentation updated
- [ ] Version numbers updated
- [ ] Changelog updated
- [ ] Security review completed
- [ ] Testnet deployment verified

## 🤝 Community

### Communication Channels
- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Discord**: Real-time chat and support

### Code of Conduct
- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Follow the golden rule

## 📄 License

By contributing to BullPawn, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project documentation

Thank you for contributing to BullPawn! 🚀
