# 欧拉筛（minp+phi+mu）

先 `sieve(limit)`，再查询 `isprime(x)` 或读取筛表；改变筛选范围时重新调用 `sieve`。

n>=0，筛内 i*p 不得溢出 int；先 sieve(n)，再查询 0..n；phiSingle 只接收正整数。 函数表长度 n+1，下标为整数本身；0 号项为 0；minp[1]=0，phi[1]=mu[1]=1，omega[1]=Omega[1]=0。

sieve 会重置全部表；phiSingle 不用筛表，试除过程中 i*i 须可放 i64；本项不提供前缀和表。

O(n) 预处理；空间 O(n)。

```cpp
// sieve 后：minp[x] 为 x 的最小质因子（x < 2 为 0）；primes 按升序列出筛到的质数
// phi[x] 为欧拉函数，mu[x] 为莫比乌斯函数；这两张表直接用整数 x 作下标
// omega[x] 只数不同质因子，Omega[x] 计重数；例如 12 = 2^2 * 3，分别是 2 和 3
std::vector<int> minp, primes, phi, mu, omega, Omega;

// 重置并线性筛出 [1,n] 的相关函数值。
void sieve(int n) {
    minp.assign(n + 1, 0);
    phi.assign(n + 1, 0);
    mu.assign(n + 1, 0);
    omega.assign(n + 1, 0);
    Omega.assign(n + 1, 0);
    primes.clear();
    if (n >= 1) {
        phi[1] = 1;
        mu[1] = 1;
        omega[1] = 0;
        Omega[1] = 0;
    }
    for (int i = 2; i <= n; i++) {
        if (minp[i] == 0) {
            minp[i] = i;
            phi[i] = i - 1;
            mu[i] = -1;
            omega[i] = 1;
            Omega[i] = 1;
            primes.push_back(i);
        }
        for (auto p : primes) {
            if (i * p > n) {
                break;
            }
            minp[i * p] = p;
            if (p == minp[i]) {
                phi[i * p] = phi[i] * p;
                omega[i * p] = omega[i];
                Omega[i * p] = Omega[i] + 1;
                break;
            }
            phi[i * p] = phi[i] * (p - 1);
            mu[i * p] = -mu[i];
            omega[i * p] = omega[i] + 1;
            Omega[i * p] = Omega[i] + 1;
        }
    }
}

// 返回 x 是否为质数，只允许查询筛内下标。
bool isprime(int n) {
    return n >= 2 && minp[n] == n;
}

// 返回单个正整数的欧拉函数值，不依赖筛。
i64 phiSingle(i64 n) {
    i64 res = n;
    for (i64 i = 2; i * i <= n; i++) {
        if (n % i == 0) {
            res = res / i * (i - 1);
            while (n % i == 0) {
                n /= i;
            }
        }
    }
    if (n > 1) {
        res = res / n * (n - 1);
    }
    return res;
}
```
