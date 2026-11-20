# Burnside与Polya（置换群 项链 手链）

group 非空且列全有限置换群，每行是同样 n 个位置的排列；mod 为素数且不整除 group.size()。 colors>=0；necklaces 需 1<=n<mod；bracelets 按当前检查需 1<=n<mod/2。

group[k][i] 是第 k 个置换把位置 i（0 起点）移到的位置；cycleWeight(len) 为该长度循环可用的染色权重。

orbits O(|G|n + log mod)；项链/手链 O(sqrt n · log mod)，空间 O(n) / O(1)。

```cpp
namespace polya {
    using ll = long long;
    namespace detail {
        ll power(ll a, ll e, ll mod) {
            a %= mod;
            if (a < 0)
                a += mod;
            ll r = 1;
            for (; e; e >>= 1, a = (__int128)a * a % mod)
                if (e & 1)
                    r = (__int128)r * a % mod;
            return r;
        }
        ll phi(ll n) {
            ll r = n;
            for (ll p = 2; p <= n / p; ++p)
                if (n % p == 0) {
                    r = r / p * (p - 1);
                    while (n % p == 0)
                        n /= p;
                }
            if (n > 1)
                r = r / n * (n - 1);
            return r;
        }
        ll rotationSum(ll n, ll c, ll mod) {
            ll ans = 0;
            auto add = [&](ll d) { ans = (ans + (__int128)phi(d) * power(c, n / d, mod)) % mod; };
            for (ll d = 1; d <= n / d; ++d)
                if (n % d == 0) {
                    add(d);
                    if (d != n / d)
                        add(n / d);
                }
            return ans;
        }
    }
    // 代入完整群的循环指标，返回模mod的轨道数/加权轨道和。
    template <class F>
    ll orbits(const std::vector<std::vector<int>> &group, F cycleWeight, ll mod) {
        assert(!group.empty() && mod >= 2 && group.size() % (unsigned long long)mod != 0);
        int n = group[0].size();
        ll ans = 0;
        for (auto &g : group) {
            assert(g.size() == n);
            std::vector<bool> seen(n), image(n);
            for (int v : g) {
                assert(v >= 0 && v < n && !image[v]);
                image[v] = true;
            }
            ll ways = 1;
            for (int i = 0; i < n; ++i)
                if (!seen[i]) {
                    int len = 0;
                    for (int v = i; !seen[v]; v = g[v])
                        seen[v] = true, ++len;
                    ll w = cycleWeight(len) % mod;
                    if (w < 0)
                        w += mod;
                    ways = (__int128)ways * w % mod;
                }
            ans = ((__int128)ans + ways) % mod;
        }
        return (__int128)ans * detail::power(group.size() % mod, mod - 2, mod) % mod;
    }
    // 返回长度n、colors种标号颜色的项链数（仅旋转等价）。
    ll necklaces(ll n, ll colors, ll mod = 998244353) {
        assert(n >= 1 && n < mod && colors >= 0);
        return (__int128)detail::rotationSum(n, colors, mod) * detail::power(n, mod - 2, mod) % mod;
    }
    // 返回长度n、colors种标号颜色的手链数（旋转与反射等价）。
    ll bracelets(ll n, ll colors, ll mod = 998244353) {
        assert(n >= 1 && n < mod / 2 && colors >= 0);
        ll s = detail::rotationSum(n, colors, mod);
        if (n & 1)
            s = ((__int128)s + (__int128)n * detail::power(colors, (n + 1) / 2, mod)) % mod;
        else
            s = ((__int128)s +
                 (__int128)(n / 2) * ((__int128)detail::power(colors, n / 2 + 1, mod) +
                                      detail::power(colors, n / 2, mod))) %
                mod;
        return (__int128)s * detail::power(2 * n, mod - 2, mod) % mod;
    }
}
```
