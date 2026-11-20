# 杜教筛（mu 与 phi 前缀和）

先 initSieve()，再查询 n>=0；S_phi 的 n*(n+1) 和其它中间值须可放 i64。 前缀为 1..n，n=0 返回 0；mu 的和可为负；多次查询复用缓存，重新初始化会清空缓存。

约 O(n^(2/3))；空间 O(n^(2/3))。

```cpp
constexpr int SIEVE_N = 1000000;

std::vector<int> muPre;
std::vector<i64> phiPre;
std::unordered_map<i64, i64> memMu, memPhi;

// 预处理小范围前缀和并清空大 n 缓存。
void initSieve() {
    std::vector<int> minp(SIEVE_N + 1, 0), primes;
    muPre.assign(SIEVE_N + 1, 0);
    phiPre.assign(SIEVE_N + 1, 0);
    muPre[1] = 1;
    phiPre[1] = 1;
    for (int i = 2; i <= SIEVE_N; i++) {
        if (minp[i] == 0) {
            minp[i] = i;
            muPre[i] = -1;
            phiPre[i] = i - 1;
            primes.push_back(i);
        }
        for (int p : primes) {
            if (i * p > SIEVE_N) {
                break;
            }
            minp[i * p] = p;
            if (p == minp[i]) {
                phiPre[i * p] = phiPre[i] * p;
                break;
            }
            phiPre[i * p] = phiPre[i] * (p - 1);
            muPre[i * p] = -muPre[i];
        }
    }
    for (int i = 1; i <= SIEVE_N; i++) {
        muPre[i] += muPre[i - 1];
        phiPre[i] += phiPre[i - 1];
    }
    memMu.clear();
    memPhi.clear();
}

// 返回 mu[1..n] 的和。
i64 S_mu(i64 n) {
    if (n <= SIEVE_N) {
        return muPre[n];
    }
    if (memMu.count(n)) {
        return memMu[n];
    }
    i64 res = 1;
    for (i64 l = 2, r; l <= n; l = r + 1) {
        r = n / (n / l);
        res -= (r - l + 1) * S_mu(n / l);
    }
    return memMu[n] = res;
}

// 返回 phi[1..n] 的和。
i64 S_phi(i64 n) {
    if (n <= SIEVE_N) {
        return phiPre[n];
    }
    if (memPhi.count(n)) {
        return memPhi[n];
    }
    i64 res = n * (n + 1) / 2;
    for (i64 l = 2, r; l <= n; l = r + 1) {
        r = n / (n / l);
        res -= (r - l + 1) * S_phi(n / l);
    }
    return memPhi[n] = res;
}
```
